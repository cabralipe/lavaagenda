/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSession, Tenant, Service, Appointment } from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('lava_agenda_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Session Accessors
  getSession(): UserSession | null {
    const raw = localStorage.getItem('lava_agenda_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserSession) {
    localStorage.setItem('lava_agenda_token', token);
    localStorage.setItem('lava_agenda_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('lava_agenda_token');
    localStorage.removeItem('lava_agenda_user');
  },

  // Auth Endpoints
  async login(email: string, password: string): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao realizar login.');
    }
    this.setSession(data.token, data.user);
    return data.user;
  },

  async register(registrationData: any): Promise<UserSession> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(registrationData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao cadastrar lava-jato.');
    }
    this.setSession(data.token, data.user);
    return data.user;
  },

  // Tenant Public Endpoints
  async getTenantBySlug(slug: string): Promise<Tenant> {
    const res = await fetch(`/api/tenants/by-slug/${slug}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lava-jato não encontrado.');
    }
    return data;
  },

  // Services Endpoints
  async getActiveServices(tenantId: string): Promise<Service[]> {
    const res = await fetch(`/api/services/tenant/${tenantId}/active`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao carregar serviços ativos.');
    }
    return data;
  },

  async getAdminServices(tenantId: string): Promise<Service[]> {
    const res = await fetch(`/api/services/tenant/${tenantId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao carregar serviços.');
    }
    return data;
  },

  async createService(service: Omit<Service, 'id' | 'tenant_id'>): Promise<Service> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(service),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao criar serviço.');
    }
    return data;
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(service),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao atualizar serviço.');
    }
    return data;
  },

  async deleteService(id: string): Promise<boolean> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao excluir serviço.');
    }
    return true;
  },

  // Appointments Endpoints
  async getAdminAppointments(tenantId: string): Promise<Appointment[]> {
    const res = await fetch(`/api/appointments/tenant/${tenantId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao carregar agendamentos.');
    }
    return data;
  },

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao atualizar status.');
    }
    return data;
  },

  async getAvailableSlots(tenantId: string, date: string, serviceId: string): Promise<string[]> {
    const query = new URLSearchParams({ tenant_id: tenantId, date, service_id: serviceId }).toString();
    const res = await fetch(`/api/appointments/slots?${query}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao buscar horários disponíveis.');
    }
    return data;
  },

  async createAppointment(appointment: any): Promise<Appointment> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(appointment),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao agendar serviço.');
    }
    return data;
  },

  async checkHealth(): Promise<{ isDemo: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { isDemo: true };
  }
};
