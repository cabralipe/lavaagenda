/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Integration tests for the LavaAgenda API (runs against the in-memory demo DB).
 * Run with: npm test
 */

import * as fs from 'fs';
import * as path from 'path';
import { createApp } from '../src/api_app';

// Start from a clean seeded demo DB.
const dbPath = path.join(process.cwd(), 'src', 'db_local.json');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const app = createApp();
const server = app.listen(0);
const addr = server.address();
const PORT = typeof addr === 'object' && addr ? addr.port : 3000;
const B = `http://localhost:${PORT}`;

let pass = 0;
let fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) { pass++; console.log('  PASS', msg); }
  else { fail++; console.log('  FAIL', msg); }
};

const req = async (method: string, url: string, body?: any, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(B + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
};

async function main() {
  console.log('\n== Health & auth ==');
  const health = await req('GET', '/api/health');
  ok(health.json?.isDemo === true, 'health reports demo mode');

  // Register a fresh tenant
  const reg = await req('POST', '/api/auth/register', {
    email: 'owner@test.com', password: 'secret123', tenantName: 'Test Wash',
    tenantSlug: 'test-wash', openingTime: '08:00', closingTime: '18:00',
  });
  ok(reg.status === 200 && reg.json?.token?.includes('.'), 'register returns signed token');
  const token = reg.json.token;
  const tenantId = reg.json.user.tenant_id;

  // Login
  const login = await req('POST', '/api/auth/login', { email: 'owner@test.com', password: 'secret123' });
  ok(login.status === 200, 'login succeeds');
  ok(login.status === 200 && login.json.user.role === 'owner', 'owner role on session');

  console.log('\n== Auth security ==');
  const forged = Buffer.from(JSON.stringify({ tenant_id: tenantId, role: 'owner' })).toString('base64');
  ok((await req('GET', `/api/services/tenant/${tenantId}`, null, forged)).status === 401, 'forged base64 token rejected');
  ok((await req('GET', `/api/services/tenant/${tenantId}`, null, token.slice(0, -3) + 'zzz')).status === 401, 'tampered signature rejected');
  ok((await req('GET', `/api/services/tenant/other-tenant`, null, token)).status === 403, 'cross-tenant blocked');
  ok((await req('POST', '/api/auth/login', { email: 'bad', password: 'x' })).status === 400, 'zod invalid email 400');

  console.log('\n== Services CRUD ==');
  const created = await req('POST', '/api/services', { name: 'Lavagem', price: 50, duration_minutes: 30 }, token);
  ok(created.status === 201, 'create service 201');
  const serviceId = created.json.id;
  ok((await req('GET', `/api/services/tenant/${tenantId}`, null, token)).json.length === 1, 'list shows 1 service');
  ok((await req('PUT', `/api/services/${serviceId}`, { price: 60 }, token)).json.price === 60, 'update service price');

  console.log('\n== Appointments + validation ==');
  ok((await req('POST', '/api/appointments', { tenant_id: tenantId, service_id: serviceId, customer_name: 'A', customer_phone: '1', appointment_date: '2020-01-01', start_time: '09:00' })).status === 400, 'past date rejected');
  ok((await req('POST', '/api/appointments', { tenant_id: tenantId, service_id: serviceId, customer_name: 'A', customer_phone: '1', appointment_date: '2099-01-01', start_time: '23:50' })).status === 400, 'outside business hours rejected');
  const apt1 = await req('POST', '/api/appointments', { tenant_id: tenantId, service_id: serviceId, customer_name: 'A', customer_phone: '1', appointment_date: '2099-01-01', start_time: '09:00' });
  ok(apt1.status === 201, 'valid appointment created');
  const aptId = apt1.json.id;
  ok((await req('POST', '/api/appointments', { tenant_id: tenantId, service_id: serviceId, customer_name: 'B', customer_phone: '2', appointment_date: '2099-01-01', start_time: '09:15' })).status === 400, 'overlapping appointment rejected');

  console.log('\n== Reschedule & delete ==');
  const resched = await req('PUT', `/api/appointments/${aptId}`, { appointment_date: '2099-01-01', start_time: '14:00' }, token);
  ok(resched.status === 200 && resched.json.start_time === '14:00', 'reschedule moves appointment');
  ok((await req('DELETE', `/api/appointments/${aptId}`, null, token)).status === 200, 'delete appointment');
  ok((await req('GET', `/api/appointments/tenant/${tenantId}`, null, token)).json.length === 0, 'appointment list empty after delete');

  console.log('\n== Team / members ==');
  const addEmp = await req('POST', '/api/members', { name: 'Func', email: 'emp@test.com', password: 'secret123' }, token);
  ok(addEmp.status === 201, 'owner adds employee');
  const empId = addEmp.json.id;
  const members = await req('GET', `/api/members/tenant/${tenantId}`, null, token);
  ok(members.json.length === 2, 'team list has owner + employee');
  const empLogin = await req('POST', '/api/auth/login', { email: 'emp@test.com', password: 'secret123' });
  ok(empLogin.status === 200 && empLogin.json.user.role === 'employee', 'employee can log in');
  const empToken = empLogin.json.token;
  ok((await req('POST', '/api/members', { name: 'X', email: 'x@test.com', password: 'secret123' }, empToken)).status === 403, 'non-owner cannot add member');
  ok((await req('PUT', `/api/tenants/${tenantId}`, { phone: '999' }, empToken)).status === 403, 'non-owner cannot edit tenant');
  const ownerMember = members.json.find((m: any) => m.role === 'owner');
  ok((await req('DELETE', `/api/members/${ownerMember.id}`, null, token)).status === 400, 'cannot remove owner');
  ok((await req('DELETE', `/api/members/${empId}`, null, token)).status === 200, 'owner removes employee');

  console.log('\n== Tenant update ==');
  const upd = await req('PUT', `/api/tenants/${tenantId}`, { name: 'Renamed Wash', closing_time: '20:00' }, token);
  ok(upd.status === 200 && upd.json.name === 'Renamed Wash', 'owner updates tenant');
  ok((await req('PUT', `/api/tenants/${tenantId}`, { opening_time: '21:00', closing_time: '20:00' }, token)).status === 400, 'invalid hours rejected');

  console.log('\n== Rate limiting ==');
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const r = await req('POST', '/api/auth/login', { email: 'brute@test.com', password: 'wrongpass' });
    if (r.status === 429) { got429 = true; break; }
  }
  ok(got429, 'login rate limiter triggers 429');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  server.close();
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('TEST CRASH', e); server.close(); process.exit(1); });
