/**
 * Attachment Storage Service — Hybrid Persistence (Cloud Supabase + Local IndexedDB)
 * Ensures attachments are definitively saved in the Supabase database and available across all devices.
 */

import { supabase } from '../lib/supabase';
import { Attachment } from '../types/finance';

const IDB_NAME = 'QuitaiDB';
const IDB_VERSION = 1;
const IDB_STORE_ATTACHMENTS = 'attachment_blobs';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_ATTACHMENTS)) {
        db.createObjectStore(IDB_STORE_ATTACHMENTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves binary base64 data to local IndexedDB for fast instant offline access
 */
export async function saveAttachmentData(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    store.put({ id, dataUrl });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not store in local IndexedDB:', err);
  }
}

/**
 * Retrieves attachment binary dataUrl.
 * 1. Checks local IndexedDB first (0ms latency, works offline).
 * 2. If not found locally (e.g. user opened on another device), automatically fetches from Supabase database!
 * 3. Caches into local IndexedDB for all subsequent views.
 */
export async function getAttachmentData(id: string): Promise<string | null> {
  // Step 1: Check local IndexedDB
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readonly');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    const req = store.get(id);
    const localData = await new Promise<string | null>((resolve) => {
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    });

    if (localData && localData.length > 50) {
      return localData;
    }
  } catch (err) {
    console.warn('IndexedDB read warning, falling back to Supabase:', err);
  }

  // Step 2: Fallback to Supabase remote database (essential for multi-device sync!)
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('data_url')
      .eq('id', id)
      .maybeSingle();

    if (!error && data?.data_url) {
      // Cache locally into IndexedDB so next access is instant and works offline
      await saveAttachmentData(id, data.data_url);
      return data.data_url;
    }
  } catch (err) {
    console.warn('Could not fetch attachment from Supabase:', err);
  }

  return null;
}

/**
 * Deletes attachment data from local IndexedDB
 */
export async function deleteAttachmentData(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    store.delete(id);
  } catch (err) {
    console.warn('Failed to delete attachment from local IndexedDB:', err);
  }
}

/**
 * Directly and definitively saves attachment metadata AND binary dataUrl into the Supabase database
 */
export async function saveAttachmentToSupabase(
  userId: string,
  att: Attachment,
  dataUrl?: string
): Promise<boolean> {
  try {
    const payload: any = {
      id: att.id,
      debt_id: att.debtId || null,
      installment_id: att.installmentId || null,
      payment_id: att.paymentId || null,
      related_type: att.relatedType || null,
      related_id: att.relatedId || null,
      user_id: userId,
      file_name: att.fileName,
      file_type: att.fileType,
      file_size: att.fileSize,
      category: att.category || 'outro',
      description: att.description || null,
      created_at: att.createdAt || new Date().toISOString(),
    };

    const finalDataUrl = dataUrl || att.dataUrl;
    if (finalDataUrl) {
      payload.data_url = finalDataUrl;
    }

    const { error } = await supabase.from('attachments').upsert(payload);
    if (error) {
      console.warn('Supabase attachment upload warning:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Exception saving attachment to Supabase:', err);
    return false;
  }
}

/**
 * Deletes an attachment from Supabase database
 */
export async function deleteAttachmentFromSupabase(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase attachment delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception deleting attachment from Supabase:', err);
    return false;
  }
}
