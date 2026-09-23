/**
 * QuitaÍ — Navbar com Perfil do Usuário, Navegação Completa e Ações Rápidas
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Plus,
  Moon,
  Sun,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Database,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Settings,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { SupabaseConfigModal } from '../supabase/SupabaseConfigModal';

export type AppNavView =
  | 'dashboard'
  | 'debts'
  | 'incomes'
  | 'expenses'
  | 'investments'
  | 'calendar'
  | 'reports'
  | 'profile'
  | 'plans'
  | 'admin';

interface NavbarProps {
  currentView: AppNavView;
  onNavigate: (view: AppNavView) => void;
  onOpenCreateDebt: () => void;
  onOpenCreateIncome: () => void;
  onOpenCreateExpense: () => void;
  onOpenCreateInvestment: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCreateDebt,
  onOpenCreateIncome,
  onOpenCreateExpense,
  onOpenCreateInvestment,
  darkMode,
  onToggleDarkMode,
}) => {
  const { debts, incomes, expenses, investments, loadDemoData } = useFinance();
  const { user, logout, isAdmin } = useAuth();
  const { currentPlan } = useSubscription();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'U';

  const navItems = [
    { id: 'dashboard' as AppNavView, label: 'Início', icon: LayoutDashboard },
    { id: 'debts' as AppNavView, label: 'Dívidas', icon: Layers, badge: debts.length },
    { id: 'incomes' as AppNavView, label: 'Entradas', icon: ArrowDownLeft, badge: incomes.length },
    { id: 'expenses' as AppNavView, label: 'Despesas', icon: ArrowUpRight, badge: expenses.length },
    { id: 'investments' as AppNavView, label: 'Investimentos', icon: TrendingUp, badge: investments.length },
    { id: 'calendar' as AppNavView, label: 'Calendário', icon: Calendar },
    { id: 'reports' as AppNavView, label: 'Relatórios', icon: FileSpreadsheet },
    { id: 'profile' as AppNavView, label: 'Perfil & Planos', icon: User },
    ...(isAdmin ? [{ id: 'admin' as AppNavView, label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - QuitaÍ */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                QuitaÍ
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                RLS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Gestão Financeira & Dívidas
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id || (item.id === 'profile' && currentView === 'plans');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Create Dropdown */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onOpenCreateDebt();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">Nova Dívida</p>
                    <p className="text-[10px] text-slate-400">Financiamento ou empréstimo</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onOpenCreateIncome();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">Nova Entrada</p>
                    <p className="text-[10px] text-slate-400">Salário, receita ou rendimento</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onOpenCreateExpense();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">Nova Despesa</p>
                    <p className="text-[10px] text-slate-400">Gasto fixo ou variável</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onOpenCreateInvestment();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">Novo Investimento</p>
                    <p className="text-[10px] text-slate-400">Reserva, ações ou renda fixa</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Supabase Status Pill */}
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            title="Configurações do Supabase & RLS"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/50 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline text-[11px]">Supabase RLS</span>
          </button>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {userInitials}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentPlan.id === 'premium'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : currentPlan.id === 'plus'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {currentPlan.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>RLS Ativo (Sessão Isolada)</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Gerenciar Perfil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('plans');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Gerenciar Planos & Assinatura</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4 text-purple-500" />
                        <span>Painel Administrativo</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsSupabaseModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Database className="w-4 h-4 text-slate-400" />
                      <span>Instruções Supabase & SQL</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sair do QuitaÍ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Scrollable horizontally) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around overflow-x-auto print:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2.5 rounded-lg ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2.5 rounded-lg ${
            currentView === 'calendar'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2.5 rounded-lg ${
            currentView === 'profile' || currentView === 'plans'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil</span>
        </button>
      </div>

      {/* Supabase Config & RLS SQL Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </header>
  );
};
