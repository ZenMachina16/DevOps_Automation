import crypto from 'crypto';

const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return secret;
}

export function sign(payload, options = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expirySeconds = options.expiresIn ?? DEFAULT_EXPIRY_SECONDS;
  const body = { ...payload, iat: issuedAt, exp: issuedAt + expirySeconds };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(body));
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = base64UrlEncode(hmacSha256(getJwtSecret(), data));
  return `${data}.${signature}`;
}

export function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signature] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = base64UrlEncode(hmacSha256(getJwtSecret(), data));
  if (expectedSig !== signature) return null;

  try {
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;
    return payload;
  } catch (_err) {
    return null;
  }
}

export default { sign, verify };


