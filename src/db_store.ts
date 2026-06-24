/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { Tenant, TenantMember, Service, Appointment, AppointmentStatus, TenantRole } from './types';

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('your-supabase');

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log('Database: Connected to Supabase real backend!');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else {
  console.log('Database: Running in Local Demo Mode (JSON storage fallback).');
}

// Local JSON DB Simulation
interface LocalUser {
  id: string;
  email: string;
  passwordHash: string; // we'll just store plain/hashed text for simulation
}

interface LocalDB {
  tenants: Tenant[];
  tenant_members: TenantMember[];
  services: Service[];
  appointments: Appointment[];
  users: LocalUser[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'src', 'db_local.json');

// Helper to write mock local data
function getInitialLocalDB(): LocalDB {
  return {
    tenants: [
      {
        id: 'tenant-1',
        name: 'Auto Brilho Estética Automotiva',
        slug: 'auto-brilho',
        phone: '(11) 99999-8888',
        address: 'Av. das Nações, 1500 - São Paulo, SP',
        opening_time: '08:00',
        closing_time: '18:00',
        created_at: new Date().toISOString()
      },
      {
        id: 'tenant-2',
        name: 'Lava Jato do João',
        slug: 'lava-jato-do-joao',
        phone: '(21) 98888-7777',
        address: 'Rua das Flores, 45 - Rio de Janeiro, RJ',
        opening_time: '08:30',
        closing_time: '17:30',
        created_at: new Date().toISOString()
      }
    ],
    tenant_members: [
      {
        id: 'member-1',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        role: 'owner',
        created_at: new Date().toISOString()
      },
      {
        id: 'member-2',
        tenant_id: 'tenant-2',
        user_id: 'user-2',
        role: 'owner',
        created_at: new Date().toISOString()
      }
    ],
    users: [
      {
        id: 'user-1',
        email: 'admin@lavaagenda.com',
        passwordHash: '123456' // Plain text for local dev convenience
      },
      {
        id: 'user-2',
        email: 'joao@lavaagenda.com',
        passwordHash: '123456'
      }
    ],
    services: [
      // Auto Brilho Services
      {
        id: 'srv-1',
        tenant_id: 'tenant-1',
        name: 'Lavagem Simples',
        description: 'Lavagem externa com secagem, aspiração interna básica e pretinho nos pneus.',
        price: 35.00,
        duration_minutes: 30,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'srv-2',
        tenant_id: 'tenant-1',
        name: 'Lavagem Completa',
        description: 'Lavagem externa detalhada, limpeza de caixas de roda, motor, aspiração profunda, cera líquida e higienização rápida do painel.',
        price: 70.00,
        duration_minutes: 60,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'srv-3',
        tenant_id: 'tenant-1',
        name: 'Higienização Interna',
        description: 'Limpeza profunda de bancos (tecido ou couro), teto, carpetes, portas, painel e eliminação de odores.',
        price: 130.00,
        duration_minutes: 120,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'srv-4',
        tenant_id: 'tenant-1',
        name: 'Polimento Comercial',
        description: 'Eliminação de riscos superficiais, devolução do brilho original da pintura com proteção por cera premium.',
        price: 190.00,
        duration_minutes: 180,
        active: true,
        created_at: new Date().toISOString()
      },
      // João Services
      {
        id: 'srv-5',
        tenant_id: 'tenant-2',
        name: 'Lavagem Simples',
        description: 'Lavagem externa rápida com espuma e aspiração.',
        price: 30.00,
        duration_minutes: 30,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'srv-6',
        tenant_id: 'tenant-2',
        name: 'Lavagem Completa',
        description: 'Lavagem completa com cera e limpeza interna caprichada.',
        price: 60.00,
        duration_minutes: 60,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'srv-7',
        tenant_id: 'tenant-2',
        name: 'Higienização de Estofados',
        description: 'Lavagem ecológica profunda de todos os bancos com extratora.',
        price: 120.00,
        duration_minutes: 120,
        active: true,
        created_at: new Date().toISOString()
      }
    ],
    appointments: [
      {
        id: 'apt-1',
        tenant_id: 'tenant-1',
        service_id: 'srv-1',
        customer_name: 'Pedro Silva',
        customer_phone: '(11) 98765-4321',
        vehicle_model: 'Chevrolet Onix',
        vehicle_plate: 'ABC-1234',
        notes: 'Cuidado extra com as rodas de liga leve.',
        appointment_date: '2026-06-23',
        start_time: '09:00',
        end_time: '09:30',
        status: 'concluido',
        created_at: new Date().toISOString()
      },
      {
        id: 'apt-2',
        tenant_id: 'tenant-1',
        service_id: 'srv-2',
        customer_name: 'Ana Costa',
        customer_phone: '(11) 97777-6666',
        vehicle_model: 'Chevrolet Tracker',
        vehicle_plate: 'XYZ-9876',
        notes: 'Cliente aguardará no local.',
        appointment_date: '2026-06-23',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmado',
        created_at: new Date().toISOString()
      },
      {
        id: 'apt-3',
        tenant_id: 'tenant-1',
        service_id: 'srv-1',
        customer_name: 'Marcos Souza',
        customer_phone: '(11) 96666-5555',
        vehicle_model: 'Honda Civic',
        vehicle_plate: 'MNO-4567',
        notes: '',
        appointment_date: '2026-06-23',
        start_time: '14:00',
        end_time: '14:30',
        status: 'pendente',
        created_at: new Date().toISOString()
      },
      {
        id: 'apt-4',
        tenant_id: 'tenant-1',
        service_id: 'srv-3',
        customer_name: 'Julia Lima',
        customer_phone: '(11) 95555-4444',
        vehicle_model: 'Jeep Compass',
        vehicle_plate: 'DEF-5678',
        notes: 'Foco na remoção de pelos de pet do banco traseiro.',
        appointment_date: '2026-06-23',
        start_time: '15:30',
        end_time: '17:30',
        status: 'em_andamento',
        created_at: new Date().toISOString()
      }
    ]
  };
}

function readLocalDB(): LocalDB {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local JSON db, using default state:', err);
  }
  const defaultDB = getInitialLocalDB();
  writeLocalDB(defaultDB);
  return defaultDB;
}

function writeLocalDB(data: LocalDB) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local JSON db:', err);
  }
}

// Helper to generate UUID
function generateUUID(): string {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

// Core Database Repositories
export const db = {
  isDemo: () => !isSupabaseConfigured,

  // --- Tenants ---
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      return local.tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase()) || null;
    }
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      return local.tenants.find(t => t.id === id) || null;
    }
  },

  async createTenant(tenantData: Omit<Tenant, 'id'>): Promise<Tenant> {
    const id = generateUUID();
    const newTenant: Tenant = {
      id,
      ...tenantData,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .insert([newTenant])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.tenants.push(newTenant);
      writeLocalDB(local);
      return newTenant;
    }
  },

  // --- Tenant Members & Simulated Authentication ---
  async createMember(member: Omit<TenantMember, 'id'>): Promise<TenantMember> {
    const id = generateUUID();
    const newMember: TenantMember = {
      id,
      ...member,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('tenant_members')
        .insert([newMember])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.tenant_members.push(newMember);
      writeLocalDB(local);
      return newMember;
    }
  },

  async authenticateUser(email: string, passwordHash: string): Promise<any> {
    if (supabase) {
      // Direct sign in using Supabase Auth (simulated or real flow)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordHash
      });
      if (error) throw error;
      if (!data.user) return null;

      // Get tenant association
      const { data: member, error: mError } = await supabase
        .from('tenant_members')
        .select('*, tenants(*)')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (mError) throw mError;
      if (!member) throw new Error('Usuário sem lava-jato cadastrado.');

      return {
        id: data.user.id,
        email: data.user.email,
        role: member.role,
        tenant_id: member.tenant_id,
        tenant_name: member.tenants.name,
        tenant_slug: member.tenants.slug
      };
    } else {
      const local = readLocalDB();
      const user = local.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash);
      if (!user) return null;

      const member = local.tenant_members.find(m => m.user_id === user.id);
      if (!member) return null;

      const tenant = local.tenants.find(t => t.id === member.tenant_id);
      if (!tenant) return null;

      return {
        id: user.id,
        email: user.email,
        role: member.role,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug
      };
    }
  },

  async registerUser(email: string, passwordHash: string, tenantData: Omit<Tenant, 'id'>): Promise<any> {
    if (supabase) {
      // 1. Sign up auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: passwordHash,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Não foi possível registrar o usuário.');

      // 2. Create tenant
      const tenant = await this.createTenant(tenantData);

      // 3. Link user as owner
      const member = await this.createMember({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        role: 'owner'
      });

      return {
        id: authData.user.id,
        email: authData.user.email,
        role: member.role,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug
      };
    } else {
      const local = readLocalDB();
      if (local.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('E-mail já cadastrado.');
      }
      if (local.tenants.some(t => t.slug.toLowerCase() === tenantData.slug.toLowerCase())) {
        throw new Error('Este slug público já está em uso.');
      }

      // Create local user
      const userId = generateUUID();
      const newUser: LocalUser = {
        id: userId,
        email,
        passwordHash
      };

      // Create tenant
      const tenantId = generateUUID();
      const newTenant: Tenant = {
        id: tenantId,
        ...tenantData,
        created_at: new Date().toISOString()
      };

      // Create member
      const memberId = generateUUID();
      const newMember: TenantMember = {
        id: memberId,
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        created_at: new Date().toISOString()
      };

      local.users.push(newUser);
      local.tenants.push(newTenant);
      local.tenant_members.push(newMember);
      writeLocalDB(local);

      return {
        id: userId,
        email,
        role: 'owner',
        tenant_id: tenantId,
        tenant_name: newTenant.name,
        tenant_slug: newTenant.slug
      };
    }
  },

  // --- Services ---
  async getServicesByTenant(tenantId: string): Promise<Service[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const local = readLocalDB();
      return local.services.filter(s => s.tenant_id === tenantId);
    }
  },

  async getActiveServicesByTenant(tenantId: string): Promise<Service[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const local = readLocalDB();
      return local.services.filter(s => s.tenant_id === tenantId && s.active);
    }
  },

  async getServiceById(serviceId: string): Promise<Service | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      return local.services.find(s => s.id === serviceId) || null;
    }
  },

  async createService(serviceData: Omit<Service, 'id'>): Promise<Service> {
    const id = generateUUID();
    const newService: Service = {
      id,
      ...serviceData,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .insert([newService])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.services.push(newService);
      writeLocalDB(local);
      return newService;
    }
  },

  async updateService(serviceId: string, updates: Partial<Omit<Service, 'id' | 'tenant_id'>>): Promise<Service> {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      const sIndex = local.services.findIndex(s => s.id === serviceId);
      if (sIndex === -1) throw new Error('Serviço não encontrado.');

      local.services[sIndex] = {
        ...local.services[sIndex],
        ...updates
      };
      writeLocalDB(local);
      return local.services[sIndex];
    }
  },

  async deleteService(serviceId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      if (error) throw error;
      return true;
    } else {
      const local = readLocalDB();
      const filtered = local.services.filter(s => s.id !== serviceId);
      if (filtered.length === local.services.length) return false;
      local.services = filtered;
      writeLocalDB(local);
      return true;
    }
  },

  // --- Appointments ---
  async getAppointmentsByTenant(tenantId: string): Promise<Appointment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(*)')
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: true });
      if (error) throw error;
      // map services onto service
      return (data || []).map(apt => ({
        ...apt,
        service: apt.services
      }));
    } else {
      const local = readLocalDB();
      return local.appointments
        .filter(apt => apt.tenant_id === tenantId)
        .map(apt => {
          const service = local.services.find(s => s.id === apt.service_id);
          return { ...apt, service };
        })
        .sort((a, b) => {
          const dateDiff = b.appointment_date.localeCompare(a.appointment_date);
          if (dateDiff !== 0) return dateDiff;
          return a.start_time.localeCompare(b.start_time);
        });
    }
  },

  async createAppointment(aptData: Omit<Appointment, 'id' | 'status'> & { status?: AppointmentStatus }): Promise<Appointment> {
    const id = generateUUID();
    const newApt: Appointment = {
      id,
      ...aptData,
      status: aptData.status || 'pendente',
      created_at: new Date().toISOString()
    };

    // Before inserting, check overlap / availability rules
    const overlapping = await this.checkOverlap(
      aptData.tenant_id,
      aptData.appointment_date,
      aptData.start_time,
      aptData.end_time
    );

    if (overlapping) {
      throw new Error('Este horário já está ocupado por outro agendamento.');
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert([newApt])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.appointments.push(newApt);
      writeLocalDB(local);
      return newApt;
    }
  },

  async updateAppointmentStatus(aptId: string, status: AppointmentStatus): Promise<Appointment> {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', aptId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      const aIndex = local.appointments.findIndex(a => a.id === aptId);
      if (aIndex === -1) throw new Error('Agendamento não encontrado.');

      local.appointments[aIndex].status = status;
      writeLocalDB(local);
      return local.appointments[aIndex];
    }
  },

  // Availability / Overlap Checker
  async checkOverlap(tenantId: string, date: string, start: string, end: string): Promise<boolean> {
    // start and end are in "HH:MM" format.
    // Check if there is any non-cancelled appointment that overlaps on this date.
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('appointment_date', date)
        .neq('status', 'cancelado');
      
      if (error) throw error;

      return (data || []).some(apt => {
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return (start.substring(0, 5) < apt.end_time.substring(0, 5) && end.substring(0, 5) > apt.start_time.substring(0, 5));
      });
    } else {
      const local = readLocalDB();
      return local.appointments.some(apt => {
        if (apt.tenant_id !== tenantId || apt.appointment_date !== date || apt.status === 'cancelado') {
          return false;
        }
        return (start.substring(0, 5) < apt.end_time.substring(0, 5) && end.substring(0, 5) > apt.start_time.substring(0, 5));
      });
    }
  }
};
