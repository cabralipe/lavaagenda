/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Appointment, Service } from '../types';
import { Calendar, CheckCircle2, Clock, BarChart3, AlertCircle, RefreshCw, ClipboardList, TrendingUp } from 'lucide-react';

interface DashboardOverviewProps {
  appointments: Appointment[];
  services: Service[];
  onRefresh: () => void;
  loading: boolean;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardOverview({ appointments, services, onRefresh, loading, onNavigateToTab }: DashboardOverviewProps) {
  
  // Dynamic stats calculation based on seeded metadata (today is 2026-06-23)
  const stats = useMemo(() => {
    const todayStr = '2026-06-23'; // Fixed baseline today to match simulation parameters
    
    const todayApts = appointments.filter(apt => apt.appointment_date === todayStr);
    const totalToday = todayApts.length;
    const pendingCount = appointments.filter(apt => apt.status === 'pendente').length;
    const confirmedCount = appointments.filter(apt => apt.status === 'confirmado').length;

    // Services breakdown counts
    const serviceCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.status !== 'cancelado') {
        const name = apt.service?.name || 'Desconhecido';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
    });

    const mostBooked = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Filter next/upcoming today's appointments (exclude concluded or cancelled)
    const upcomingToday = todayApts
      .filter(apt => apt.status === 'confirmado' || apt.status === 'em_andamento' || apt.status === 'pendente')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return {
      totalToday,
      pendingCount,
      confirmedCount,
      mostBooked,
      upcomingToday,
    };
  }, [appointments]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'em_andamento':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'concluido':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelado':
        return 'bg-red-50 text-red-700 border-red-200';
      default: // pendente
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Visão Geral</h2>
          <p className="text-xs text-slate-500 mt-0.5">Indicadores chave calculados para Hoje (23/06/2026)</p>
        </div>
        <button
          id="dashboard-btn-refresh"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recarregar dados
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agendamentos de Hoje</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalToday}</h3>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendentes de Aprovação</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {stats.pendingCount}{' '}
              {stats.pendingCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full ml-1">Ação necessária</span>
              )}
            </h3>
          </div>
        </div>

        {/* Confirmed list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agendamentos Confirmados</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.confirmedCount}</h3>
          </div>
        </div>

      </div>

      {/* Analytics block */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Next Hours Timeline (3 cols) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 md:col-span-3">
          <h4 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Próximos Serviços de Hoje
          </h4>

          {stats.upcomingToday.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum agendamento pendente, confirmado ou em andamento para hoje.
              <button
                onClick={() => onNavigateToTab('appointments')}
                className="block mx-auto mt-2 text-blue-600 hover:underline font-bold"
              >
                Ver agenda completa &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {stats.upcomingToday.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {apt.start_time} - {apt.end_time}
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">{apt.customer_name}</span>
                    </div>
                    <div className="text-slate-500 font-medium flex items-center gap-2">
                      <span>🚙 {apt.vehicle_model || 'Não informado'}</span>
                      {apt.vehicle_plate && (
                        <span className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded text-[10px]">
                          {apt.vehicle_plate}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] font-semibold">🛠️ {apt.service?.name}</p>
                  </div>

                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getStatusStyle(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Booked Services (2 cols) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 md:col-span-2">
          <h4 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Serviços Mais Procurados
          </h4>

          {stats.mostBooked.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Nenhum serviço agendado no histórico.</div>
          ) : (
            <div className="space-y-4">
              {stats.mostBooked.map((svc, index) => (
                <div key={index} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold">{svc.name}</span>
                    <span className="text-slate-400 font-bold">{svc.count} agendamento{svc.count > 1 ? 's' : ''}</span>
                  </div>
                  {/* Visual Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (svc.count / Math.max(1, appointments.length)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateToTab('services')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold inline-flex items-center gap-1"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Gerenciar catálogo de serviços &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
