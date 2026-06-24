/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    api.checkHealth().then((res) => {
      if (active) {
        setIsDemo(res.isDemo);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (isDemo === null) return null;

  return (
    <div className={`text-xs px-4 py-2 border-b transition-colors flex items-center justify-between ${
      isDemo 
        ? 'bg-amber-50 text-amber-800 border-amber-200' 
        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }`}>
      <div className="flex items-center gap-2">
        {isDemo ? (
          <>
            <AlertCircle id="demo-banner-alert-icon" className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Modo de Demonstração Ativo:</strong> Os dados estão sendo salvos no arquivo local do servidor. Para usar o banco real do <strong>Supabase</strong>, configure o arquivo <code>.env.local</code>.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 id="demo-banner-success-icon" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Conectado ao Supabase:</strong> Banco de dados PostgreSQL real e Autenticação Supabase ativos.
            </span>
          </>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-mono font-bold bg-white/65 px-2 py-0.5 rounded border border-current">
        {isDemo ? 'Demo Mode' : 'Supabase Active'}
      </div>
    </div>
  );
}
