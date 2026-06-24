/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { UserSession, Service, Appointment } from './types';

// Components
import DemoBanner from './components/DemoBanner';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import PublicBookingPage from './components/PublicBookingPage';
import DashboardOverview from './components/DashboardOverview';
import ServicesManagement from './components/ServicesManagement';
import AppointmentsManagement from './components/AppointmentsManagement';

// Icons
import { Calendar, LayoutDashboard, Settings2, CalendarDays, LogOut, Copy, ExternalLink, Menu, X, Check } from 'lucide-react';

export default function App() {
  // Simple Client-side Router State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Administrative Active Tab ("dashboard", "services", "appointments")
  const [adminTab, setAdminTab] = useState('dashboard');
  
  // Auth & Session
  const [session, setSession] = useState<UserSession | null>(api.getSession());

  // Shared Administrative Data State
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Copy Link State Feedback
  const [linkCopied, setLinkCopied] = useState(false);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Router listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Helper to change URL and trigger re-render
  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync session user
  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setAdminTab('dashboard');
    navigateTo('/dashboard');
  };

  const handleLogout = () => {
    api.clearSession();
    setSession(null);
    navigateTo('/');
  };

  // Administrative Data Fetching
  const loadAdminData = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const [sList, aList] = await Promise.all([
        api.getAdminServices(session.tenant_id),
        api.getAdminAppointments(session.tenant_id)
      ]);
      setServices(sList);
      setAppointments(aList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data when session changes or when admin tabs are rendered
  useEffect(() => {
    if (session && (currentPath.startsWith('/dashboard') || currentPath === '/dashboard')) {
      loadAdminData();
    }
  }, [session, currentPath]);

  // Sync admin tab with deep URL parameters
  useEffect(() => {
    if (currentPath === '/dashboard/services') {
      setAdminTab('services');
    } else if (currentPath === '/dashboard/appointments') {
      setAdminTab('appointments');
    } else if (currentPath === '/dashboard') {
      setAdminTab('dashboard');
    }
  }, [currentPath]);

  // Handle URL Copy
  const copyPublicLink = () => {
    if (!session) return;
    const publicUrl = `${window.location.origin}/l/${session.tenant_slug}`;
    navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Router Dispatcher (Renders correct view depending on URL structure)
  const renderRoute = () => {
    // 1. Public Booking Page: /l/[slug]
    if (currentPath.startsWith('/l/')) {
      const slug = currentPath.substring(3).trim();
      return <PublicBookingPage slug={slug} onNavigate={navigateTo} />;
    }

    // 2. Auth Routes
    if (currentPath === '/login') {
      if (session) {
        navigateTo('/dashboard');
        return null;
      }
      return <LoginPage onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />;
    }

    if (currentPath === '/register') {
      if (session) {
        navigateTo('/dashboard');
        return null;
      }
      return <RegisterPage onNavigate={navigateTo} onRegisterSuccess={handleLoginSuccess} />;
    }

    // 3. Administrative Routes (requires login)
    if (currentPath.startsWith('/dashboard')) {
      if (!session) {
        // Redirect to login safely
        setTimeout(() => navigateTo('/login'), 0);
        return null;
      }

      const activePublicLink = `${window.location.origin}/l/${session.tenant_slug}`;

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          
          {/* Header */}
          <header id="admin-header" className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              
              {/* Brand logo & mobile trigger */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="font-sans font-bold text-lg text-slate-800 tracking-tight">LavaAgenda</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wide font-mono hidden sm:inline">Painel</span>
                </div>
              </div>

              {/* User Identity / Logout */}
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-800">{session.tenant_name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Logado como {session.email} ({session.role})</div>
                </div>
                
                <button
                  id="admin-btn-logout"
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-600 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-slate-200 rounded-lg px-2.5 py-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>

            </div>
          </header>

          {/* Quick link bar for administrators */}
          <div className="bg-blue-600 text-white py-3.5 px-4 shadow-sm border-b border-blue-700">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Link Público</span>
                <span className="font-semibold text-blue-100 hidden sm:inline">Compartilhe o link de agendamento por WhatsApp com seus clientes:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  readOnly
                  value={activePublicLink}
                  className="bg-blue-700 text-blue-100 border border-blue-500 rounded-lg px-2.5 py-1 text-xs font-mono select-all flex-grow sm:flex-grow-0 sm:w-64 focus:outline-none"
                />
                <button
                  id="admin-btn-copy-link"
                  onClick={copyPublicLink}
                  className="bg-white hover:bg-slate-50 text-blue-600 font-bold py-1 px-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1 text-[11px] flex-shrink-0 cursor-pointer"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Link
                    </>
                  )}
                </button>
                <a
                  href={activePublicLink}
                  target="_blank"
                  rel="noreferrer referrer"
                  className="bg-blue-500 hover:bg-blue-400 text-white p-1 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  title="Abrir Página Pública"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Main Dashboard Layout */}
          <div className="max-w-7xl mx-auto w-full px-4 py-8 flex flex-col sm:flex-row gap-8 flex-grow">
            
            {/* Left Sidebar Navigation */}
            <aside className={`sm:w-64 flex-shrink-0 ${mobileMenuOpen ? 'block' : 'hidden sm:block'}`}>
              <nav className="space-y-1.5 bg-slate-900 text-slate-300 p-4 rounded-2xl shadow-sm border border-slate-800">
                
                {/* Tab: Dashboard */}
                <button
                  id="tab-btn-dashboard"
                  onClick={() => {
                    setAdminTab('dashboard');
                    navigateTo('/dashboard');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    adminTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  Painel Geral
                </button>

                {/* Tab: Agenda */}
                <button
                  id="tab-btn-appointments"
                  onClick={() => {
                    setAdminTab('appointments');
                    navigateTo('/dashboard/appointments');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    adminTab === 'appointments'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <CalendarDays className="w-4.5 h-4.5" />
                  Agenda Administrativa
                  {appointments.filter(a => a.status === 'pendente').length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                      {appointments.filter(a => a.status === 'pendente').length}
                    </span>
                  )}
                </button>

                {/* Tab: Serviços */}
                <button
                  id="tab-btn-services"
                  onClick={() => {
                    setAdminTab('services');
                    navigateTo('/dashboard/services');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    adminTab === 'services'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Settings2 className="w-4.5 h-4.5" />
                  Serviços Oferecidos
                </button>

                {/* Active Tenant Box from the Professional Polish design theme */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Empresa Ativa</p>
                    <p className="text-xs font-bold text-white leading-tight">{session.tenant_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sessão: {session.tenant_slug}</p>
                    <button 
                      onClick={() => navigateTo(`/l/${session.tenant_slug}`)}
                      className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                    >
                      Ver página pública →
                    </button>
                  </div>
                </div>

              </nav>
            </aside>

            {/* Right main area */}
            <main className="flex-grow bg-white border border-slate-100 p-6 sm:p-8 rounded-2xl shadow-2xs min-h-[500px]">
              {adminTab === 'services' && (
                <ServicesManagement
                  services={services}
                  tenantId={session.tenant_id}
                  onRefresh={loadAdminData}
                  loading={loading}
                />
              )}
              {adminTab === 'appointments' && (
                <AppointmentsManagement
                  appointments={appointments}
                  services={services}
                  onRefresh={loadAdminData}
                  loading={loading}
                />
              )}
              {adminTab === 'dashboard' && (
                <DashboardOverview
                  appointments={appointments}
                  services={services}
                  onRefresh={loadAdminData}
                  loading={loading}
                  onNavigateToTab={(tab) => {
                    setAdminTab(tab);
                    navigateTo(`/dashboard/${tab === 'dashboard' ? '' : tab}`);
                  }}
                />
              )}
            </main>

          </div>
        </div>
      );
    }

    // 4. Default Landing Page
    return <LandingPage onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DemoBanner />
      <div className="flex-grow">
        {renderRoute()}
      </div>
    </div>
  );
}
