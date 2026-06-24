-- --------------------------------------------------------
-- LAVAAGENDA - SUPABASE SQL SCHEMA & RLS POLICIES
-- --------------------------------------------------------

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tenants Table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  phone text,
  address text,
  opening_time time not null default '08:00:00',
  closing_time time not null default '18:00:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tenant Members Table (associates auth.users with a tenant)
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'employee')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, user_id)
);

-- 3. Services Table
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0.00,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Appointments Table
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  vehicle_model text,
  vehicle_plate text,
  notes text,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- Helper function to check if user belongs to a tenant
create or replace function public.is_tenant_member(tenant_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.tenant_members
    where tenant_members.tenant_id = $1
    and tenant_members.user_id = auth.uid()
  );
end;
$$ language plpgsql;

-- Policies for Tenants
create policy "Users can view their own tenant information"
  on public.tenants for select
  using (public.is_tenant_member(id));

create policy "Anyone can view a tenant profile by slug for booking"
  on public.tenants for select
  using (true); -- Public read permitted so scheduling page works

-- Policies for Tenant Members
create policy "Members can view other members of the same tenant"
  on public.tenant_members for select
  using (public.is_tenant_member(tenant_id));

create policy "Owners can manage members of their own tenant"
  on public.tenant_members for all
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tenant_members.tenant_id
      and tenant_members.user_id = auth.uid()
      and tenant_members.role = 'owner'
    )
  );

-- Policies for Services
create policy "Anyone can view active services of any tenant"
  on public.services for select
  using (active = true); -- Public scheduling needs active services

create policy "Members can view all services of their own tenant"
  on public.services for select
  using (public.is_tenant_member(tenant_id));

create policy "Members can modify services of their own tenant"
  on public.services for all
  using (public.is_tenant_member(tenant_id));

-- Policies for Appointments
create policy "Members can read and write appointments of their own tenant"
  on public.appointments for all
  using (public.is_tenant_member(tenant_id));

create policy "Anyone can create an appointment (public booking)"
  on public.appointments for insert
  with check (true); -- Booking page inserts appointments directly
