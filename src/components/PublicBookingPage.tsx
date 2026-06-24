/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Tenant, Service, Appointment } from '../types';
import { Calendar, MapPin, Phone, Car, Clock, ShieldCheck, CheckCircle2, MessageSquare, Loader2, Info, ArrowLeft } from 'lucide-react';

interface PublicBookingPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export default function PublicBookingPage({ slug, onNavigate }: PublicBookingPageProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheduling Form State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    // Default to today
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [successApt, setSuccessApt] = useState<Appointment | null>(null);

  // Fetch Tenant profile and services
  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const t = await api.getTenantBySlug(slug);
        if (active) {
          setTenant(t);
          const sList = await api.getActiveServices(t.id);
          setServices(sList);
          if (sList.length > 0) {
            setSelectedService(sList[0]);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Lava-jato não encontrado.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [slug]);

  // Fetch Available Slots whenever Service or Date changes
  useEffect(() => {
    if (!tenant || !selectedService || !appointmentDate) return;

    let active = true;
    const fetchSlots = async () => {
      try {
        setSelectedSlot(null);
        const slots = await api.getAvailableSlots(tenant.id, appointmentDate, selectedService.id);
        if (active) {
          setAvailableSlots(slots);
        }
      } catch (err) {
        console.error('Error loading slots:', err);
      }
    };
    fetchSlots();
    return () => {
      active = false;
    };
  }, [tenant, selectedService, appointmentDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !selectedService || !appointmentDate || !selectedSlot || !customerName || !customerPhone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setBookingLoading(true);
    try {
      const apt = await api.createAppointment({
        tenant_id: tenant.id,
        service_id: selectedService.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        vehicle_model: vehicleModel,
        vehicle_plate: vehiclePlate,
        notes,
        appointment_date: appointmentDate,
        start_time: selectedSlot
      });
      setSuccessApt(apt);
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar agendamento. Verifique se o horário ainda está disponível.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate beautiful pre-filled WhatsApp confirmation message
  const getWhatsAppLink = () => {
    if (!tenant || !successApt || !selectedService) return '';
    const cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Olá! Gostaria de confirmar meu agendamento no LavaAgenda:\n\n` +
      `👤 *Cliente:* ${successApt.customer_name}\n` +
      `🚗 *Veículo:* ${successApt.vehicle_model} (${successApt.vehicle_plate || 'Sem placa'})\n` +
      `🛠️ *Serviço:* ${selectedService.name}\n` +
      `📅 *Data:* ${successApt.appointment_date.split('-').reverse().join('/')}\n` +
      `⏰ *Horário:* ${successApt.start_time}\n\n` +
      `Aguardando confirmação! Obrigado.`
    );
    return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando página de agendamento...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 font-sans text-center">
        <Info className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Lava-jato não encontrado</h2>
        <p className="text-slate-500 mt-2 max-w-md">O link acessado é inválido ou o lava-jato foi desativado do sistema.</p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 cursor-pointer"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  // Success view
  if (successApt) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          <div className="inline-flex items-center justify-center bg-green-100 p-3 rounded-full text-green-600 mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agendamento Solicitado!</h2>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Seu agendamento para <strong>{tenant.name}</strong> foi enviado com sucesso. Aguarde a confirmação.
          </p>

          {/* Details Card */}
          <div className="my-6 bg-slate-50 rounded-xl p-4 text-left border border-slate-100 text-sm space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Resumo da Reserva</div>
            <div className="flex justify-between"><span className="text-slate-500">Serviço:</span> <strong className="text-slate-800">{selectedService?.name}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Data:</span> <strong className="text-slate-800">{appointmentDate.split('-').reverse().join('/')}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Horário:</span> <strong className="text-slate-800">{successApt.start_time}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Veículo:</span> <strong className="text-slate-800">{successApt.vehicle_model}</strong></div>
            {successApt.vehicle_plate && (
              <div className="flex justify-between"><span className="text-slate-500">Placa:</span> <strong className="text-slate-800 font-mono">{successApt.vehicle_plate}</strong></div>
            )}
          </div>

          <div className="space-y-3">
            {tenant.phone && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer referrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                Avisar no WhatsApp da Loja
              </a>
            )}
            <button
              onClick={() => {
                setSuccessApt(null);
                setCustomerName('');
                setCustomerPhone('');
                setVehicleModel('');
                setVehiclePlate('');
                setNotes('');
              }}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Banner with Back link */}
      <div className="bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-800 tracking-tight">LavaAgenda</span>
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">Agendamento Público</span>
          </div>
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ir para SaaS
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Business Hero Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Lava-jato Verificado
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-3">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {tenant.address || 'Endereço não informado'}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              Segunda a Sábado — {tenant.opening_time.substring(0, 5)} às {tenant.closing_time.substring(0, 5)}
            </p>
          </div>
          {tenant.phone && (
            <div className="sm:self-center">
              <a
                href={`https://wa.me/55${tenant.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer referrer"
                className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600 fill-current" />
                WhatsApp: {tenant.phone}
              </a>
            </div>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Choices */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Service Chooser */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                1. Escolha o Serviço
              </h3>
              
              {services.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhum serviço ativo cadastrado por este lava-jato no momento.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedService?.id === svc.id
                          ? 'border-blue-600 bg-blue-50/20'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService?.id === svc.id}
                        onChange={() => setSelectedService(svc)}
                        className="sr-only"
                      />
                      <div className="pr-4">
                        <div className="font-bold text-slate-800 text-sm">{svc.name}</div>
                        {svc.description && <p className="text-xs text-slate-500 mt-1">{svc.description}</p>}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {svc.duration_minutes} min
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-blue-600 font-extrabold text-base">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Chooser */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                2. Selecione a Data
              </h3>
              <div className="mt-2">
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  min={new Date().toISOString().split('T')[0]} // Block historical dates
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="block w-full py-3 px-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Time Slot Chooser */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                3. Selecione o Horário Disponível
              </h3>
              
              {!selectedService ? (
                <p className="text-xs text-slate-400 py-4 text-center">Selecione um serviço para calcular os horários livres.</p>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500">Nenhum horário livre para este dia.</p>
                  <p className="text-xs text-slate-400 mt-1">Por favor, tente selecionar outra data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                        selectedSlot === slot
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Customer Details & Confirmation */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 sticky top-24">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                4. Seus Dados
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cust-name" className="block text-xs font-semibold text-slate-600">
                    Seu Nome *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-semibold text-slate-600">
                    Seu Celular/WhatsApp *
                  </label>
                  <input
                    id="cust-phone"
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    placeholder="Ex: (11) 99999-8888"
                  />
                </div>

                <div>
                  <label htmlFor="veh-model" className="block text-xs font-semibold text-slate-600">
                    Modelo do Veículo
                  </label>
                  <div className="relative rounded-md shadow-xs mt-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Car className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="veh-model"
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                      placeholder="Ex: Chevrolet Onix"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="veh-plate" className="block text-xs font-semibold text-slate-600">
                    Placa do Veículo
                  </label>
                  <input
                    id="veh-plate"
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-mono"
                    placeholder="Ex: ABC1D23 ou ABC-1234"
                  />
                </div>

                <div>
                  <label htmlFor="cust-notes" className="block text-xs font-semibold text-slate-600">
                    Alguma observação?
                  </label>
                  <textarea
                    id="cust-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 resize-none"
                    placeholder="Ex: Deixar o carro sem cheirinho"
                  />
                </div>

                {/* Confirm Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    id="booking-btn-submit"
                    type="submit"
                    disabled={bookingLoading || !selectedSlot}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 focus:outline-none transition-colors cursor-pointer"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </button>
                  {!selectedSlot && (
                    <p className="text-[10px] text-center text-red-500 mt-2 font-medium">
                      * Selecione uma data e horário para confirmar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
