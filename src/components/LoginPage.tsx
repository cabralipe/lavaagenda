/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Mail, Lock, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (session: any) => void;
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const session = await api.login(email, password);
      onLoginSuccess(session);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@lavaagenda.com');
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <button
          id="login-btn-back"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-sm">
            <Calendar id="login-logo-icon" className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Acesse sua agenda administrativa
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Ou{' '}
          <button
            id="login-btn-go-register"
            onClick={() => onNavigate('/register')}
            className="font-semibold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
          >
            cadastre seu lava-jato grátis
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-800 rounded-r flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Endereço de E-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                  placeholder="admin@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Senha de Acesso
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                id="login-btn-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 h-5 mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Box */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                Acesso de Teste Rápido
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                Use nossa conta modelo já preenchida para explorar o painel sem precisar configurar nada agora.
              </p>
              <button
                id="login-btn-demo-fill"
                type="button"
                onClick={fillDemoCredentials}
                className="w-full bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                Preencher Conta de Teste
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
