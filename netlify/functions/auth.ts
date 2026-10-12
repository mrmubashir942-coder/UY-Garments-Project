import crypto from 'crypto';

const SALT = 'uy_garments_salt_2026_mubashir';

const OWNER_USER = {
  id: 'uy-owner-primary',
  username: 'uygarment942',
  name: 'UY Garment',
  role: 'OWNER',
};

// Known authorized salted SHA-256 hashes for system owner account
const AUTHORIZED_SALTED_HASHES = [
  '8951c33d0479211ae3e36a9192831651ce7dcdc34dc79e32237e506d19979319', // uygarment942
  '0fc625994209a6c5c3a9f4ce7776efce9fe8f9952ae68b47a6b09a9a9d93a906', // UYGarments@2026
  '3ff78ed0eae1e5575eb12413a899a3f3f9a74e8cf3a9b2bdd34ae6079d81ee89', // UYGarment942
  'ecb88be7c1d4a9ba4dbce1bca4c18910964e4782ad539a5761bb6eabe8fcc2c7', // uygarments942
  '3892a8512236b0e9b9b40cd34ece8b518a014793be87016eaffb445568e502df', // mrmubashir942
];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(SALT + password).digest('hex');
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler = async (event: {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
}) => {
  // Handle CORS pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'ok',
        service: 'UY Garments Netlify Auth Service',
        owner: OWNER_USER.name,
        role: OWNER_USER.role,
        username: OWNER_USER.username,
      }),
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  let body: Record<string, any> = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Malformed JSON payload' }),
    };
  }

  const { action, identifier, password, code, newPassword } = body;

  // Handle verify token action
  if (action === 'verify' || event.path?.endsWith('/verify')) {
    const token = body.token || event.headers['authorization']?.replace('Bearer ', '');
    if (token && token.startsWith('uy_')) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, user: OWNER_USER }),
      };
    }
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Invalid or expired session token' }),
    };
  }

  // Default POST action: Login
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId || !cleanPass) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Please enter both your username and password.',
      }),
    };
  }

  const validIdentifiers = [
    'uygarment942',
    'mrmubashir942@gmail.com',
    'owner',
    'admin',
  ];

  if (!validIdentifiers.includes(cleanId)) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Unrecognised account. Only the authorised owner may sign in.',
      }),
    };
  }

  // Check custom environment variables in Netlify
  const envPassword = process.env.OWNER_PASSWORD || process.env.VITE_OWNER_PASSWORD;
  const envPasswordHash = process.env.OWNER_PASSWORD_HASH || process.env.VITE_OWNER_PASSWORD_HASH;

  let isValid = false;

  // 1. Direct match if OWNER_PASSWORD is set in Netlify environment variables
  if (envPassword && cleanPass === envPassword) {
    isValid = true;
  }

  // 2. Salted hash comparison
  const enteredSaltedHash = hashPassword(cleanPass);

  // 3. Match against OWNER_PASSWORD_HASH if provided in Netlify
  if (envPasswordHash && enteredSaltedHash === envPasswordHash) {
    isValid = true;
  }

  // 4. Match against pre-authorized owner credential hashes
  if (AUTHORIZED_SALTED_HASHES.includes(enteredSaltedHash)) {
    isValid = true;
  }

  // 5. Fallback check for raw SHA-256 match against OWNER_PASSWORD_HASH (without salt)
  if (!isValid && envPasswordHash) {
    const rawHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
    if (rawHash === envPasswordHash) {
      isValid = true;
    }
  }

  if (!isValid) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Invalid password. Access denied for unauthorised entry.',
      }),
    };
  }

  // Generate secure session token
  const token = 'uy_live_' + crypto.randomBytes(16).toString('hex') + Date.now().toString(36);
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      token,
      expiresAt,
      user: OWNER_USER,
    }),
  };
};
