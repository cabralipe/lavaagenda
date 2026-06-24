/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Building2, Link2, MapPin, Phone, Clock, Mail, Lock, User, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegisterSuccess: (session: any) => void;
}

export default function RegisterPage({ onNavigate, onRegisterSuccess }: RegisterPageProps) {
  // Form fields
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenantName(val);
    
    // Convert to slug format: alphanumeric, lowercase, dashes
    const slug = val
      .toLowerCase()
      .normalize('NFD') // remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '') // keep only alphanumeric, spaces, and dashes
      .trim()
      .replace(/\s+/g, '-'); // replace spaces with dashes

    setTenantSlug(slug);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-'); // allow letters, numbers, dash, underscore
    setTenantSlug(cleanSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantSlug || !openingTime || !closingTime || !ownerName || !email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const session = await api.register({
        email,
        password,
        tenantName,
        tenantSlug,
        phone,
        address,
        openingTime,
        closingTime,
        ownerName
      });
      onRegisterSuccess(session);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <button
          id="register-btn-back"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-sm">
            <Calendar id="register-logo-icon" className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Crie seu Lava-jato no LavaAgenda
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <button
            id="register-btn-go-login"
            onClick={() => onNavigate('/login')}
            className="font-semibold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
          >
            Acesse o Painel
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-800 rounded-r flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Business Details */}
            <div>
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                1. Informações do Lava-jato
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tenantName" className="block text-sm font-semibold text-slate-700">
                    Nome do Lava-jato *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="tenantName"
                      name="tenantName"
                      type="text"
                      required
                      value={tenantName}
                      onChange={handleNameChange}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Ex: Auto Brilho"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tenantSlug" className="block text-sm font-semibold text-slate-700">
                    Slug Público (Link) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="tenantSlug"
                      name="tenantSlug"
                      type="text"
                      required
                      value={tenantSlug}
                      onChange={handleSlugChange}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800 font-mono text-blue-700"
                      placeholder="auto-brilho"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Seu link será: <strong className="font-mono text-slate-600">/l/{tenantSlug || 'link'}</strong>
                  </p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                    Telefone/WhatsApp *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Ex: (11) 99999-8888"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
                    Endereço Completo *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Ex: Av. das Nações, 1500 - SP"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="openingTime" className="block text-sm font-semibold text-slate-700">
                    Horário de Abertura *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="openingTime"
                      name="openingTime"
                      type="time"
                      required
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="closingTime" className="block text-sm font-semibold text-slate-700">
                    Horário de Fechamento *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      required
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Owner Details */}
            <div>
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                2. Conta do Administrador Responsável
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-semibold text-slate-700">
                    Nome do Responsável *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    E-mail de Acesso *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Ex: joao@exemplo.com"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Crie uma Senha *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                id="register-btn-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Criando seu Lava-jato...
                  </>
                ) : (
                  'Cadastrar meu Lava-jato'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
