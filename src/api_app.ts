/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared Express application factory.
 * Consumed by both server.ts (local dev) and api/[...path].ts (Vercel).
 */

import express from 'express';
import { z } from 'zod';
import { db } from './db_store';
import { AppointmentStatus } from './types';
import { signToken, verifyToken } from './auth';

// --- time helpers ---
function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Normalize a "HH:MM" or "HH:MM:SS" value to comparable minutes-of-day.
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  return h * 60 + m;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

// --- validation schemas ---
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  tenantName: z.string().min(1),
  tenantSlug: z.string().min(1),
  openingTime: z.string().regex(HHMM, 'Horário de abertura inválido.'),
  closingTime: z.string().regex(HHMM, 'Horário de fechamento inválido.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().optional(),
});

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  duration_minutes: z.coerce.number().int().positive(),
  active: z.boolean().optional(),
});

const appointmentSchema = z.object({
  tenant_id: z.string().min(1),
  service_id: z.string().min(1),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  vehicle_model: z.string().optional(),
  vehicle_plate: z.string().optional(),
  notes: z.string().optional(),
  appointment_date: z.string().regex(YMD, 'Data inválida.'),
  start_time: z.string().regex(HHMM, 'Horário inválido.'),
});

const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  opening_time: z.string().regex(HHMM, 'Horário de abertura inválido.').optional(),
  closing_time: z.string().regex(HHMM, 'Horário de fechamento inválido.').optional(),
});

const memberCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  name: z.string().min(1),
});

const rescheduleSchema = z.object({
  appointment_date: z.string().regex(YMD, 'Data inválida.'),
  start_time: z.string().regex(HHMM, 'Horário inválido.'),
});

function firstZodError(err: z.ZodError): string {
  return err.issues[0]?.message || 'Dados inválidos.';
}

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Basic in-memory login rate limiter (per IP+email). Note: per-instance in serverless.
  const loginAttempts = new Map<string, { count: number; first: number }>();
  const RL_WINDOW = 15 * 60 * 1000;
  const RL_MAX = 8;
  const rateKey = (req: express.Request, email: string) =>
    `${(req.headers['x-forwarded-for'] as string) || req.ip || ''}|${email.toLowerCase()}`;

  const getSessionUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return verifyToken(authHeader.substring(7));
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }
    (req as any).user = user;
    next();
  };

  // --- Health ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', isDemo: db.isDemo(), currentTime: new Date().toISOString() });
  });

  // --- Auth ---
  app.post('/api/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: firstZodError(parsed.error) });
    }
    const { email, password } = parsed.data;
    const key = rateKey(req, email);
    const rec = loginAttempts.get(key);
    if (rec && Date.now() - rec.first < RL_WINDOW && rec.count >= RL_MAX) {
      return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' });
    }
    const registerFail = () => {
      const cur = loginAttempts.get(key);
      if (!cur || Date.now() - cur.first >= RL_WINDOW) loginAttempts.set(key, { count: 1, first: Date.now() });
      else cur.count++;
    };
    try {
      const session = await db.authenticateUser(email, password);
      if (!session) {
        registerFail();
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }
      loginAttempts.delete(key);
      res.json({ token: signToken(session), user: session });
    } catch (error: any) {
      registerFail();
      const isBadCreds = /invalid login credentials/i.test(error.message || '');
      if (isBadCreds) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao realizar login.' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: firstZodError(parsed.error) });
      }
      const d = parsed.data;
      const slug = d.tenantSlug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      const session = await db.registerUser(d.email, d.password, {
        name: d.tenantName,
        slug,
        phone: d.phone || '',
        address: d.address || '',
        opening_time: d.openingTime,
        closing_time: d.closingTime,
      });
      res.json({ token: signToken(session), user: session });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Erro ao cadastrar lava-jato.' });
    }
  });

  // --- Tenants (public) ---
  app.get('/api/tenants/by-slug/:slug', async (req, res) => {
    try {
      const tenant = await db.getTenantBySlug(req.params.slug);
      if (!tenant) return res.status(404).json({ error: 'Lava-jato não encontrado.' });
      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Services ---
  app.get('/api/services/tenant/:tenant_id/active', async (req, res) => {
    try {
      res.json(await db.getActiveServicesByTenant(req.params.tenant_id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/services/tenant/:tenant_id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.tenant_id !== req.params.tenant_id) {
        return res.status(403).json({ error: 'Acesso negado a dados de outro lava-jato.' });
      }
      res.json(await db.getServicesByTenant(req.params.tenant_id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/services', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const parsed = serviceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: firstZodError(parsed.error) });
      }
      const s = parsed.data;
      const service = await db.createService({
        tenant_id: user.tenant_id,
        name: s.name,
        description: s.description || '',
        price: s.price,
        duration_minutes: s.duration_minutes,
        active: s.active !== false,
      });
      res.status(201).json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/services/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const service = await db.getServiceById(req.params.id);
      if (!service) return res.status(404).json({ error: 'Serviço não encontrado.' });
      if (service.tenant_id !== user.tenant_id) {
        return res.status(403).json({ error: 'Permissão negada.' });
      }
      const body = req.body || {};
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.price !== undefined) updates.price = Number(body.price);
      if (body.duration_minutes !== undefined) updates.duration_minutes = Number(body.duration_minutes);
      if (body.active !== undefined) updates.active = body.active;
      const updated = await db.updateService(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/services/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const service = await db.getServiceById(req.params.id);
      if (!service) return res.status(404).json({ error: 'Serviço não encontrado.' });
      if (service.tenant_id !== user.tenant_id) {
        return res.status(403).json({ error: 'Permissão negada.' });
      }
      await db.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Appointments ---
  app.get('/api/appointments/tenant/:tenant_id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.tenant_id !== req.params.tenant_id) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }
      res.json(await db.getAppointmentsByTenant(req.params.tenant_id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/appointments/:id/status', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status } = req.body;
      const allowed: AppointmentStatus[] = ['pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado'];
      if (!status || !allowed.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }
      const appointments = await db.getAppointmentsByTenant(user.tenant_id);
      if (!appointments.some(a => a.id === req.params.id)) {
        return res.status(403).json({ error: 'Agendamento não encontrado ou não pertence ao seu lava-jato.' });
      }
      res.json(await db.updateAppointmentStatus(req.params.id, status as AppointmentStatus));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/appointments/slots', async (req, res) => {
    try {
      const { tenant_id, date, service_id } = req.query;
      if (!tenant_id || !date || !service_id) {
        return res.status(400).json({ error: 'Os parâmetros tenant_id, date e service_id são obrigatórios.' });
      }
      const tenant = await db.getTenantById(tenant_id as string);
      const service = await db.getServiceById(service_id as string);
      if (!tenant || !service) {
        return res.status(404).json({ error: 'Lava-jato ou serviço não encontrado.' });
      }
      const openMin = toMinutes(tenant.opening_time);
      const closeMin = toMinutes(tenant.closing_time);
      const duration = service.duration_minutes;

      const appointments = await db.getAppointmentsByTenant(tenant.id);
      const activeAptsOnDate = appointments.filter(
        apt => apt.appointment_date === date && apt.status !== 'cancelado'
      );

      const availableSlots: string[] = [];
      for (let cur = openMin; cur + duration <= closeMin; cur += 30) {
        const start = cur;
        const end = cur + duration;
        const hasOverlap = activeAptsOnDate.some(apt => {
          const aptStart = toMinutes(apt.start_time);
          const aptEnd = toMinutes(apt.end_time);
          return start < aptEnd && end > aptStart;
        });
        if (!hasOverlap) {
          availableSlots.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
        }
      }
      res.json(availableSlots);
    } catch (error: any) {
      console.error('Error calculating slots:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const parsed = appointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: firstZodError(parsed.error) });
      }
      const d = parsed.data;

      const tenant = await db.getTenantById(d.tenant_id);
      if (!tenant) return res.status(404).json({ error: 'Lava-jato não encontrado.' });

      const service = await db.getServiceById(d.service_id);
      if (!service || service.tenant_id !== d.tenant_id) {
        return res.status(404).json({ error: 'Serviço escolhido não existe.' });
      }

      // Reject past dates (compare in YYYY-MM-DD, lexicographic == chronological).
      const today = new Date().toISOString().slice(0, 10);
      if (d.appointment_date < today) {
        return res.status(400).json({ error: 'Não é possível agendar em uma data passada.' });
      }

      // Enforce business hours.
      const startMin = toMinutes(d.start_time);
      const endMin = startMin + service.duration_minutes;
      const openMin = toMinutes(tenant.opening_time);
      const closeMin = toMinutes(tenant.closing_time);
      if (startMin < openMin || endMin > closeMin) {
        return res.status(400).json({ error: 'Horário fora do período de funcionamento do lava-jato.' });
      }

      const end_time = addMinutes(d.start_time, service.duration_minutes);
      const appointment = await db.createAppointment({
        tenant_id: d.tenant_id,
        service_id: d.service_id,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        vehicle_model: d.vehicle_model || '',
        vehicle_plate: d.vehicle_plate || '',
        notes: d.notes || '',
        appointment_date: d.appointment_date,
        start_time: d.start_time,
        end_time,
        status: 'pendente',
      });
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      res.status(400).json({ error: error.message || 'Horário indisponível ou erro no agendamento.' });
    }
  });

  // --- Tenant profile (owner only) ---
  app.put('/api/tenants/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'owner') return res.status(403).json({ error: 'Apenas o proprietário pode editar os dados do lava-jato.' });
      if (user.tenant_id !== req.params.id) return res.status(403).json({ error: 'Acesso negado.' });
      const parsed = tenantUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed.error) });
      const current = await db.getTenantById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Lava-jato não encontrado.' });
      const eff = { ...current, ...parsed.data };
      if (toMinutes(eff.opening_time) >= toMinutes(eff.closing_time)) {
        return res.status(400).json({ error: 'O horário de abertura deve ser anterior ao de fechamento.' });
      }
      res.json(await db.updateTenant(req.params.id, parsed.data));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Team / members ---
  app.get('/api/members/tenant/:tenant_id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.tenant_id !== req.params.tenant_id) return res.status(403).json({ error: 'Acesso negado.' });
      res.json(await db.getMembersByTenant(req.params.tenant_id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/members', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'owner') return res.status(403).json({ error: 'Apenas o proprietário pode adicionar funcionários.' });
      const parsed = memberCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed.error) });
      const member = await db.createEmployee(user.tenant_id, parsed.data);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Falha ao adicionar funcionário.' });
    }
  });

  app.delete('/api/members/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'owner') return res.status(403).json({ error: 'Apenas o proprietário pode remover funcionários.' });
      const member = await db.getMemberById(req.params.id);
      if (!member || member.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Funcionário não encontrado.' });
      if (member.role === 'owner') return res.status(400).json({ error: 'Não é possível remover o proprietário.' });
      await db.deleteMember(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Appointment reschedule / delete ---
  app.put('/api/appointments/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const apt = await db.getAppointmentById(req.params.id);
      if (!apt || apt.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Agendamento não encontrado.' });
      const parsed = rescheduleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed.error) });
      const { appointment_date, start_time } = parsed.data;
      const tenant = await db.getTenantById(user.tenant_id);
      const service = await db.getServiceById(apt.service_id);
      if (!tenant || !service) return res.status(404).json({ error: 'Dados do agendamento incompletos.' });
      const today = new Date().toISOString().slice(0, 10);
      if (appointment_date < today) return res.status(400).json({ error: 'Não é possível agendar em uma data passada.' });
      const startMin = toMinutes(start_time);
      const endMin = startMin + service.duration_minutes;
      if (startMin < toMinutes(tenant.opening_time) || endMin > toMinutes(tenant.closing_time)) {
        return res.status(400).json({ error: 'Horário fora do período de funcionamento do lava-jato.' });
      }
      const end_time = addMinutes(start_time, service.duration_minutes);
      const overlap = await db.checkOverlap(user.tenant_id, appointment_date, start_time, end_time, apt.id);
      if (overlap) return res.status(400).json({ error: 'Este horário já está ocupado por outro agendamento.' });
      res.json(await db.updateAppointment(apt.id, { appointment_date, start_time, end_time }));
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Falha ao reagendar.' });
    }
  });

  app.delete('/api/appointments/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const apt = await db.getAppointmentById(req.params.id);
      if (!apt || apt.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Agendamento não encontrado.' });
      await db.deleteAppointment(apt.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}
