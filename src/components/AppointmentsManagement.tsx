/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Appointment, Service, AppointmentStatus } from '../types';
import { Check, Play, CheckCircle2, XCircle, Filter, Calendar, Phone, MessageSquare, Car, FileText, Info, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface AppointmentsManagementProps {
  appointments: Appointment[];
  services: Service[];
  onRefresh: () => void;
  loading: boolean;
}

type DateFilterType = 'all' | 'today' | 'tomorrow' | 'week';

export default function AppointmentsManagement({ appointments, services, onRefresh, loading }: AppointmentsManagementProps) {
  // Filters state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const [statusChangeLoading, setStatusChangeLoading] = useState<string | null>(null);

  // Dynamic date references based on the real current date (local time).
  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const _now = new Date();
  const BASELINE_TODAY = toYMD(_now);
  const _tomorrow = new Date(_now);
  _tomorrow.setDate(_now.getDate() + 1);
  const BASELINE_TOMORROW = toYMD(_tomorrow);

  // Current week boundaries (Sunday -> Saturday).
  const _sow = new Date(_now);
  _sow.setDate(_now.getDate() - _now.getDay());
  const _eow = new Date(_sow);
  _eow.setDate(_sow.getDate() + 6);
  const startOfWeek = toYMD(_sow);
  const endOfWeek = toYMD(_eow);

  // Apply filters reactively
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // 1. Date filter
      if (dateFilter === 'today' && apt.appointment_date !== BASELINE_TODAY) return false;
      if (dateFilter === 'tomorrow' && apt.appointment_date !== BASELINE_TOMORROW) return false;
      if (dateFilter === 'week') {
        if (apt.appointment_date < startOfWeek || apt.appointment_date > endOfWeek) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      // 3. Service filter
      if (serviceFilter !== 'all' && apt.service_id !== serviceFilter) return false;

      return true;
    });
  }, [appointments, dateFilter, statusFilter, serviceFilter]);

  const handleUpdateStatus = async (aptId: string, newStatus: AppointmentStatus) => {
    setStatusChangeLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, newStatus);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar status.');
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'concluido':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default: // pendente
        return 'bg-amber-100 text-amber-800 border-amber-200';
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

  // Helper to format date nicely
  const formatDateLabel = (dateStr: string) => {
    if (dateStr === BASELINE_TODAY) return 'Hoje (23/06)';
    if (dateStr === BASELINE_TOMORROW) return 'Amanhã (24/06)';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Pre-filled WhatsApp message for rapid contact
  const getWhatsAppContactLink = (apt: Appointment) => {
    const cleanPhone = apt.customer_phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Olá ${apt.customer_name}! Sou do lava-jato e gostaria de falar sobre seu agendamento do serviço *${apt.service?.name}* no dia *${formatDateLabel(apt.appointment_date)}* às *${apt.start_time}*.`
    );
    return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${text}`;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Agenda Administrativa</h2>
        <p className="text-xs text-slate-500 mt-0.5">Visualize todos os horários solicitados e atualize o status do serviço</p>
      </div>

      {/* Filter Control Board */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtros Rápidos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Date Selector */}
          <div className="space-y-1">
            <label htmlFor="filter-date" className="block text-xs font-semibold text-slate-600">Período</label>
            <select
              id="filter-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="all">Qualquer data (Histórico)</option>
              <option value="today">Hoje (Terça, 23/06)</option>
              <option value="tomorrow">Amanhã (Quarta, 24/06)</option>
              <option value="week">Esta semana (21/06 a 27/06)</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-600">Status</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="confirmado">Confirmados</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluídos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          {/* Service Selector */}
          <div className="space-y-1">
            <label htmlFor="filter-service" className="block text-xs font-semibold text-slate-600">Serviço</label>
            <select
              id="filter-service"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="all">Todos os serviços</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>{svc.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Agenda List */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Buscando agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Nenhum registro coincide com os filtros selecionados acima. Tente redefinir os filtros ou recarregar os dados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`bg-white rounded-2xl p-5 border shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-slate-100`}
            >
              {/* Left Details */}
              <div className="space-y-2 text-xs">
                
                {/* Time Badge and Name */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 text-[11px] inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateLabel(apt.appointment_date)} às {apt.start_time} - {apt.end_time}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>

                {/* Customer Details */}
                <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                  {apt.customer_name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-slate-400" />
                    <span>🚙 {apt.vehicle_model || 'Não informado'}</span>
                    {apt.vehicle_plate && (
                      <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-700">
                        {apt.vehicle_plate}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">{apt.customer_phone}</span>
                    <a
                      href={getWhatsAppContactLink(apt)}
                      target="_blank"
                      rel="noreferrer referrer"
                      className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      Chamar
                    </a>
                  </div>
                </div>

                <p className="font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 w-fit">
                  🛠️ {apt.service?.name} ({apt.service?.duration_minutes} min) —{' '}
                  <span className="text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.service?.price || 0)}
                  </span>
                </p>

                {apt.notes && (
                  <p className="text-slate-400 text-[11px] bg-slate-50/50 p-2 rounded-md italic border-l-2 border-slate-300">
                    📝 Obs: {apt.notes}
                  </p>
                )}

              </div>

              {/* Right Actions Block */}
              <div className="flex flex-wrap items-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto">
                {statusChangeLoading === apt.id ? (
                  <div className="text-xs text-slate-400 flex items-center gap-1 font-medium mx-auto">
                    <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
                    Atualizando...
                  </div>
                ) : (
                  <>
                    {/* Action: Confirm */}
                    {apt.status === 'pendente' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'confirmado')}
                        className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirmar
                      </button>
                    )}

                    {/* Action: Em Andamento */}
                    {(apt.status === 'confirmado' || apt.status === 'pendente') && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'em_andamento')}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Lavar Carro
                      </button>
                    )}

                    {/* Action: Concluir */}
                    {apt.status === 'em_andamento' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'concluido')}
                        className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluir
                      </button>
                    )}

                    {/* Action: Cancel */}
                    {apt.status !== 'concluido' && apt.status !== 'cancelado' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'cancelado')}
                        className="inline-flex items-center gap-1 hover:bg-red-50 border border-slate-200 text-red-600 hover:text-red-700 hover:border-red-200 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
