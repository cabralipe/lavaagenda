/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  opening_time: string; // "HH:MM"
  closing_time: string; // "HH:MM"
  created_at?: string;
}

export type TenantRole = 'owner' | 'employee';

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  email?: string;
  name?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at?: string;
}

export type AppointmentStatus = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_model: string;
  vehicle_plate: string;
  notes: string;
  appointment_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  status: AppointmentStatus;
  created_at?: string;
  // Expanded relation fields
  service?: Service;
}

export interface UserSession {
  id: string;
  email: string;
  role: TenantRole;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface DashboardStats {
  totalToday: number;
  pendingCount: number;
  confirmedCount: number;
  mostBookedServices: { name: string; count: number }[];
  upcomingAppointments: Appointment[];
}
