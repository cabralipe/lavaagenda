/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lightweight signed-token helper (HMAC-SHA256).
 * Replaces the previous forgeable base64-only "token".
 */

import * as crypto from 'crypto';

// Secret precedence: explicit AUTH_SECRET, then the Supabase service role key
// (always set in production), then a dev-only fallback.
const SECRET =
  process.env.AUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'lavaagenda-dev-secret-change-me';

const TTL_SECONDS = 60 * 60 * 12; // 12 hours

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signToken(payload: Record<string, any>): string {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string | undefined | null): any | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload;
  } catch {
    return null;
  }
}
