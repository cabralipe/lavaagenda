/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, Clock, Loader2, AlertCircle, Info } from 'lucide-react';
import { api } from '../lib/api';

interface ServicesManagementProps {
  services: Service[];
  tenantId: string;
  onRefresh: () => void;
  loading: boolean;
}

export default function ServicesManagement({ services, tenantId, onRefresh, loading }: ServicesManagementProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('30');
    setActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setName(svc.name);
    setDescription(svc.description || '');
    setPrice(svc.price.toString());
    setDuration(svc.duration_minutes.toString());
    setActive(svc.active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !duration) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numPrice = Number(price);
    const numDuration = Number(duration);

    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Preço inválido.');
      return;
    }

    if (isNaN(numDuration) || numDuration <= 0) {
      setFormError('Duração inválida.');
      return;
    }

    setSubmitLoading(true);
    setFormError(null);

    try {
      if (editingService) {
        await api.updateService(editingService.id, {
          name,
          description,
          price: numPrice,
          duration_minutes: numDuration,
          active
        });
      } else {
        await api.createService({
          name,
          description,
          price: numPrice,
          duration_minutes: numDuration,
          active
        });
      }
      onRefresh();
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar serviço.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (svc: Service) => {
    try {
      await api.updateService(svc.id, { active: !svc.active });
      onRefresh();
    } catch (err) {
      alert('Falha ao alternar status do serviço.');
    }
  };

  const handleDelete = async (svcId: string) => {
    if (!confirm('Deseja realmente excluir este serviço? Esta ação não pode ser desfeita.')) return;
    try {
      await api.deleteService(svcId);
      onRefresh();
    } catch (err) {
      alert('Não foi possível excluir o serviço pois ele possui agendamentos vinculados.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Serviços Oferecidos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os pacotes e lavagens disponíveis para agendamento pelos clientes</p>
        </div>
        <button
          id="services-btn-add"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Serviço
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Sincronizando catálogo...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">Seu catálogo está vazio</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Seus clientes não conseguem agendar sem serviços cadastrados. Adicione lavagens simples, completas, higienizações ou polimento para começar a vender.
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
          >
            Cadastrar meu primeiro serviço
          </button>
        </div>
      ) : (
        /* Services grid card list */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white rounded-2xl p-5 border shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-4 ${
                svc.active ? 'border-slate-100' : 'border-slate-200 opacity-65 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{svc.name}</h3>
                    {svc.description ? (
                      <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{svc.description}</p>
                    ) : (
                      <p className="text-slate-400 text-xs mt-1.5 italic">Sem descrição.</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-blue-600 font-black text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duração: {svc.duration_minutes} min</span>
                  </div>
                  
                  <button
                    onClick={() => handleToggleActive(svc)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {svc.active ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                        <span>Inativo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-end gap-3.5">
                <button
                  onClick={() => openEditModal(svc)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(svc.id)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded-r flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                  placeholder="Ex: Lavagem Detalhada"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 resize-none"
                  placeholder="Diga brevemente o que inclui o serviço..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Preço (R$) *</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600">Duração (Minutos) *</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="block w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min (1h)</option>
                      <option value="90">90 min (1h30)</option>
                      <option value="120">120 min (2h)</option>
                      <option value="150">150 min (2h30)</option>
                      <option value="180">180 min (3h)</option>
                      <option value="240">240 min (4h)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Disponível para agendamento imediato
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm inline-flex items-center gap-1 cursor-pointer"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="animate-spin w-3.5 h-3.5" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Serviço'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
