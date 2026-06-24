/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, Shield, Users, Clock, ArrowRight, Zap, Car, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Clock,
      title: 'Agendamento 24h sem esforço',
      description: 'Seu cliente entra na sua página exclusiva, escolhe o serviço e o melhor horário disponível em poucos cliques.',
    },
    {
      icon: Users,
      title: 'SaaS Multi-Tenant',
      description: 'Sua conta e dados de lava-jato são 100% isolados, garantindo segurança e privacidade total.',
    },
    {
      icon: Shield,
      title: 'Evite conflito de horários',
      description: 'Nosso algoritmo inteligente valida a duração de cada serviço e bloqueia automaticamente horários já ocupados.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Navbar */}
      <header id="landing-header" className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Calendar id="header-logo-icon" className="w-6 h-6" />
            </div>
            <span className="font-sans font-bold text-xl text-slate-800 tracking-tight">LavaAgenda</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              id="header-btn-login"
              onClick={() => onNavigate('/login')}
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer"
            >
              Entrar
            </button>
            <button
              id="header-btn-register"
              onClick={() => onNavigate('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Cadastrar Lava-jato
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>SISTEMA DE AGENDAMENTO COMPLETO PARA LAVA-JATOS</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Preencha sua agenda de <span className="text-blue-600">lava-jato</span> no piloto automático
        </h1>
        
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Ofereça um link exclusivo de agendamento online para seus clientes pelo WhatsApp. Eles escolhem o serviço e marcam em segundos. Livre de erros e furos de horário.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-btn-register"
            onClick={() => onNavigate('/register')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            Começar Grátis agora
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            id="hero-btn-login"
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-200 transition-all text-base cursor-pointer"
          >
            Entrar como Administrador
          </button>
        </div>

        {/* Demo Warning box */}
        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl max-w-xl mx-auto p-4 text-left text-sm text-blue-800">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-600" />
            Demonstração integrada:
          </p>
          <p>
            Não quer cadastrar um agora? Use o botão <strong>Entrar</strong> no topo com o e-mail de demonstração <code>admin@lavaagenda.com</code> e senha <code>123456</code> para testar a agenda e os serviços do lava-jato modelo <strong>Auto Brilho</strong>!
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features-section" className="bg-white border-t border-b border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tudo que você precisa para crescer</h2>
            <p className="text-slate-500 mt-2">Diga adeus à complicação do papel e caneta.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xs transition-shadow">
                <div className="bg-blue-600 text-white p-3 rounded-xl w-fit mb-4">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">{feat.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for customers */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Veja como é fácil para seu cliente</h2>
          <p className="text-slate-500 mt-2">Um fluxo fluido projetado especialmente para celulares.</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-6">
          <div className="p-5 bg-white border border-slate-100 rounded-xl relative">
            <span className="absolute -top-3 -left-3 bg-blue-100 text-blue-800 font-extrabold w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            <h4 className="font-bold text-slate-800 mt-2">Acessa o link</h4>
            <p className="text-xs text-slate-500 mt-1">O cliente acessa seu link exclusivo enviado pelo WhatsApp.</p>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-xl relative">
            <span className="absolute -top-3 -left-3 bg-blue-100 text-blue-800 font-extrabold w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            <h4 className="font-bold text-slate-800 mt-2">Escolhe o serviço</h4>
            <p className="text-xs text-slate-500 mt-1">Visualiza o preço, descrição e tempo de duração dos seus serviços.</p>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-xl relative">
            <span className="absolute -top-3 -left-3 bg-blue-100 text-blue-800 font-extrabold w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            <h4 className="font-bold text-slate-800 mt-2">Escolhe data e hora</h4>
            <p className="text-xs text-slate-500 mt-1">Vê em tempo real apenas os horários realmente livres do seu lava-jato.</p>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-xl relative">
            <span className="absolute -top-3 -left-3 bg-blue-100 text-blue-800 font-extrabold w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            <h4 className="font-bold text-slate-800 mt-2">Cadastra veículo</h4>
            <p className="text-xs text-slate-500 mt-1">Informa o carro, placa, telefone e pronto! O agendamento é solicitado.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="landing-footer" className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-md">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-lg">LavaAgenda</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 LavaAgenda. Todos os direitos reservados. Projeto educacional SaaS multi-tenant.
          </p>
        </div>
      </footer>
    </div>
  );
}
