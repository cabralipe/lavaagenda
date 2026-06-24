/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless entrypoint for the LavaAgenda API.
 * Wraps the Express application as a single catch-all function handling /api/*.
 */

import express from 'express';
import { db } from '../src/db_store';
import { AppointmentStatus } from '../src/types';

// Helper to add minutes to "HH:MM"
function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

const app = express();
app.use(express.json());

// Simple Session Authorization Helper
const getSessionUser = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
  (req as any).user = user;
  next();
};

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    isDemo: db.isDemo(),
    currentTime: new Date().toISOString()
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const session = await db.authenticateUser(email, password);
    if (!session) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const token = Buffer.from(JSON.stringify(session)).toString('base64');
    res.json({ token, user: session });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao realizar login.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email, password, tenantName, tenantSlug, phone, address,
      openingTime, closingTime
    } = req.body;
    if (!email || !password || !tenantName || !tenantSlug || !openingTime || !closingTime) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }
    const slug = tenantSlug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const session = await db.registerUser(email, password, {
      name: tenantName,
      slug,
      phone: phone || '',
      address: address || '',
      opening_time: openingTime,
      closing_time: closingTime
    });
    const token = Buffer.from(JSON.stringify(session)).toString('base64');
    res.json({ token, user: session });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Erro ao cadastrar lava-jato.' });
  }
});

app.get('/api/tenants/by-slug/:slug', async (req, res) => {
  try {
    const tenant = await db.getTenantBySlug(req.params.slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Lava-jato não encontrado.' });
    }
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/tenant/:tenant_id/active', async (req, res) => {
  try {
    const services = await db.getActiveServicesByTenant(req.params.tenant_id);
    res.json(services);
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
    const services = await db.getServicesByTenant(req.params.tenant_id);
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, description, price, duration_minutes, active } = req.body;
    if (!name || price === undefined || !duration_minutes) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios.' });
    }
    const service = await db.createService({
      tenant_id: user.tenant_id,
      name,
      description: description || '',
      price: Number(price),
      duration_minutes: Number(duration_minutes),
      active: active !== false
    });
    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serviceId = req.params.id;
    const service = await db.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    if (service.tenant_id !== user.tenant_id) {
      return res.status(403).json({ error: 'Permissão negada.' });
    }
    const { name, description, price, duration_minutes, active } = req.body;
    const updated = await db.updateService(serviceId, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
      active
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serviceId = req.params.id;
    const service = await db.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    if (service.tenant_id !== user.tenant_id) {
      return res.status(403).json({ error: 'Permissão negada.' });
    }
    await db.deleteService(serviceId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/appointments/tenant/:tenant_id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const tenantId = req.params.tenant_id;
    if (user.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    const appointments = await db.getAppointmentsByTenant(tenantId);
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id/status', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const aptId = req.params.id;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório.' });
    }
    const appointments = await db.getAppointmentsByTenant(user.tenant_id);
    const exists = appointments.some(a => a.id === aptId);
    if (!exists) {
      return res.status(403).json({ error: 'Agendamento não encontrado ou não pertence ao seu lava-jato.' });
    }
    const updated = await db.updateAppointmentStatus(aptId, status as AppointmentStatus);
    res.json(updated);
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
    const opening = tenant.opening_time.substring(0, 5);
    const closing = tenant.closing_time.substring(0, 5);
    const duration = service.duration_minutes;
    const appointments = await db.getAppointmentsByTenant(tenant.id);
    const activeAptsOnDate = appointments.filter(
      apt => apt.appointment_date === date && apt.status !== 'cancelado'
    );
    const availableSlots: string[] = [];
    let current = opening;
    while (current < closing) {
      const proposedEnd = addMinutes(current, duration);
      if (proposedEnd <= closing) {
        const hasOverlap = activeAptsOnDate.some(apt => {
          const aptStart = apt.start_time.substring(0, 5);
          const aptEnd = apt.end_time.substring(0, 5);
          return (current < aptEnd && proposedEnd > aptStart);
        });
        if (!hasOverlap) {
          availableSlots.push(current);
        }
      }
      current = addMinutes(current, 30);
    }
    res.json(availableSlots);
  } catch (error: any) {
    console.error('Error calculating slots:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const {
      tenant_id, service_id, customer_name, customer_phone,
      vehicle_model, vehicle_plate, notes, appointment_date, start_time
    } = req.body;
    if (!tenant_id || !service_id || !customer_name || !customer_phone || !appointment_date || !start_time) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }
    const service = await db.getServiceById(service_id);
    if (!service) {
      return res.status(404).json({ error: 'Serviço escolhido não existe.' });
    }
    const end_time = addMinutes(start_time, service.duration_minutes);
    const appointment = await db.createAppointment({
      tenant_id, service_id, customer_name, customer_phone,
      vehicle_model: vehicle_model || '',
      vehicle_plate: vehicle_plate || '',
      notes: notes || '',
      appointment_date, start_time, end_time,
      status: 'pendente'
    });
    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ error: error.message || 'Horário indisponível ou erro no agendamento.' });
  }
});

export default app;
