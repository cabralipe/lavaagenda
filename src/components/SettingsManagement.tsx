/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserSession, TenantMember } from '../types';
import { api } from '../lib/api';
import {
  Building2, Save, Loader2, AlertCircle, Users, UserPlus, Trash2, ShieldCheck, Info, CheckCircle2,
} from 'lucide-react';

interface SettingsManagementProps {
  session: UserSession;
  onSessionUpdate: (session: UserSession) => void;
}

export default function SettingsManagement({ session, onSessionUpdate }: SettingsManagementProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantSaved, setTenantSaved] = useState(false);

  const isOwner = session.role === 'owner';
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingTenant(true);
        const t = await api.getTenantBySlug(session.tenant_slug);
        setName(t.name || '');
        setPhone(t.phone || '');
        setAddress(t.address || '');
        setOpeningTime((t.opening_time || '08:00').substring(0, 5));
        setClosingTime((t.closing_time || '18:00').substring(0, 5));
      } catch (err: any) {
        setTenantError(err.message || 'Falha ao carregar dados.');
      } finally {
        setLoadingTenant(false);
      }
    })();
  }, [session.tenant_slug]);

  const loadMembers = async () => {
    if (!isOwner) return;
    try {
      setLoadingMembers(true);
      setMembers(await api.getMembers(session.tenant_id));
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.tenant_id, isOwner]);

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);
    setTenantSaved(false);
    if (!name.trim()) {
      setTenantError('O nome do lava-jato é obrigatório.');
      return;
    }
    if (openingTime >= closingTime) {
      setTenantError('O horário de abertura deve ser anterior ao de fechamento.');
      return;
    }
    setSavingTenant(true);
    try {
      const updated = await api.updateTenant(session.tenant_id, {
        name: name.trim(),
        phone,
        address,
        opening_time: openingTime,
        closing_time: closingTime,
      });
      const newSession: UserSession = { ...session, tenant_name: updated.name };
      api.setSession(localStorage.getItem('lava_agenda_token') || '', newSession);
      onSessionUpdate(newSession);
      setTenantSaved(true);
      setTimeout(() => setTenantSaved(false), 2500);
    } catch (err: any) {
      setTenantError(err.message || 'Falha ao salvar.');
    } finally {
      setSavingTenant(false);
    }
  };

  const openAddMember = () => {
    setMName('');
    setMEmail('');
    setMPassword('');
    setMemberError(null);
    setModalOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);
    if (!mName.trim() || !mEmail.trim() || mPassword.length < 6) {
      setMemberError('Preencha nome, e-mail e uma senha de ao menos 6 caracteres.');
      return;
    }
    setSavingMember(true);
    try {
      await api.createMember({ name: mName.trim(), email: mEmail.trim(), password: mPassword });
      setModalOpen(false);
      await loadMembers();
    } catch (err: any) {
      setMemberError(err.message || 'Falha ao adicionar funcionário.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (m: TenantMember) => {
    if (m.role === 'owner') return;
    if (!confirm(`Remover ${m.name || m.email || 'este funcionário'} da equipe?`)) return;
    try {
      await api.deleteMember(m.id);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Falha ao remover funcionário.');
    }
  };

  const inputCls =
    'block w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800';

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Configurações</h2>
        <p className="text-xs text-slate-500 mt-0.5">Gerencie os dados do seu lava-jato e a sua equipe</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><Building2 className="w-4 h-4" /></div>
          <h3 className="font-extrabold text-slate-800 text-sm">Dados do Lava-Jato</h3>
        </div>

        {loadingTenant ? (
          <div className="py-10 text-center"><Loader2 className="animate-spin w-6 h-6 text-blue-600 mx-auto" /></div>
        ) : (
          <form onSubmit={handleSaveTenant} className="space-y-4">
            {tenantError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded-r flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{tenantError}</span>
              </div>
            )}
            {tenantSaved && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 text-xs text-green-800 rounded-r flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Dados salvos com sucesso.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600">Nome *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} disabled={!isOwner} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Telefone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} disabled={!isOwner} placeholder="(11) 99999-8888" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">Endereço</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} disabled={!isOwner} placeholder="Rua, número - cidade" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Abertura *</label>
                <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className={inputCls} disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">Fechamento *</label>
                <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className={inputCls} disabled={!isOwner} />
              </div>
            </div>

            {isOwner ? (
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingTenant} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer">
                  {savingTenant ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savingTenant ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Apenas o proprietário pode editar estes dados.</p>
            )}
          </form>
        )}
      </section>

      {isOwner && (
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><Users className="w-4 h-4" /></div>
              <h3 className="font-extrabold text-slate-800 text-sm">Equipe</h3>
            </div>
            <button onClick={openAddMember} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm cursor-pointer">
              <UserPlus className="w-4 h-4" /> Adicionar Funcionário
            </button>
          </div>

          {loadingMembers ? (
            <div className="py-8 text-center"><Loader2 className="animate-spin w-6 h-6 text-blue-600 mx-auto" /></div>
          ) : members.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum membro cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${m.role === 'owner' ? 'bg-blue-600' : 'bg-slate-400'}`}>
                      {(m.name || m.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.name || m.email || 'Sem nome'}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${m.role === 'owner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {m.role === 'owner' && <ShieldCheck className="w-3 h-3" />}
                      {m.role === 'owner' ? 'Proprietário' : 'Funcionário'}
                    </span>
                    {m.role !== 'owner' && (
                      <button onClick={() => handleRemoveMember(m)} className="text-slate-400 hover:text-red-600 cursor-pointer" title="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm">Novo Funcionário</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              {memberError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded-r flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{memberError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600">Nome *</label>
                <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} className={inputCls} placeholder="Nome do funcionário" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">E-mail *</label>
                <input type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} className={inputCls} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">Senha * (mín. 6 caracteres)</label>
                <input type="password" value={mPassword} onChange={(e) => setMPassword(e.target.value)} className={inputCls} placeholder="••••••" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 font-semibold text-xs rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" disabled={savingMember} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm inline-flex items-center gap-1 cursor-pointer">
                  {savingMember ? <><Loader2 className="animate-spin w-3.5 h-3.5" /> Salvando...</> : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
