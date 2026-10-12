import { AppUser } from '../types';

export const OWNER_USER: AppUser = {
  id: 'uy-owner-primary',
  username: 'uygarment942',
  name: 'UY Garment',
  role: 'OWNER',
};

const SESSION_KEY = 'uy_garments_owner_session';
const CREDS_KEY = 'uy_garments_owner_credentials';
const RESET_KEY = 'uy_garments_password_reset';
const SALT = 'uy_garments_salt_2026_mubashir';

export const OWNER_EMAIL = 'mrmubashir942@gmail.com';

// Pre-computed salted SHA-256 hashes for authorised owner credentials.
// Plaintext passwords are NEVER stored in source code or committed to version control.
const AUTHORIZED_SALTED_HASHES: string[] = [
  '8951c33d0479211ae3e36a9192831651ce7dcdc34dc79e32237e506d19979319', // Salted hash for supplied account credential
  '0fc625994209a6c5c3a9f4ce7776efce9fe8f9952ae68b47a6b09a9a9d93a906', // Salted hash for system baseline credential
  '3ff78ed0eae1e5575eb12413a899a3f3f9a74e8cf3a9b2bdd34ae6079d81ee89',
  'ecb88be7c1d4a9ba4dbce1bca4c18910964e4782ad539a5761bb6eabe8fcc2c7',
  '3892a8512236b0e9b9b40cd34ece8b518a014793be87016eaffb445568e502df',
];

interface AuthSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  userId: string;
}

export interface PasswordResetRecord {
  code: string;
  email: string;
  maskedEmail: string;
  expiresAt: number;
  createdAt: number;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  private listeners: Set<(isAuthenticated: boolean) => void> = new Set();
  private failedAttempts: number = 0;
  private lockoutUntil: number = 0;

  constructor() {
    // Validate session on instantiation
    this.isAuthenticated();
  }

  public isAuthenticated(): boolean {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session: AuthSession = JSON.parse(raw);
      if (!session || !session.expiresAt) return false;
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  public getCurrentUser(): AppUser {
    return OWNER_USER;
  }

  public async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    // Check lockout for brute force prevention
    if (Date.now() < this.lockoutUntil) {
      const waitSeconds = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Security cooldown active for ${waitSeconds}s.`,
      };
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        error: 'Please enter both your username and password.',
      };
    }

    // Authorised owner identity checks
    const validIdentifiers = [
      'uygarment942',
      'mrmubashir942@gmail.com',
      'owner',
      'admin',
    ];

    if (!validIdentifiers.includes(cleanId)) {
      this.registerFailedAttempt();
      return {
        success: false,
        error: 'Unrecognised account. Only the authorised owner may sign in.',
      };
    }

    // 1. Attempt Server-Side Production Authentication (Netlify Functions / API)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.token) {
          this.failedAttempts = 0;
          this.lockoutUntil = 0;
          const session: AuthSession = {
            token: result.token,
            createdAt: Date.now(),
            expiresAt: result.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000,
            userId: OWNER_USER.id,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          this.notify();
          return { success: true };
        }
      } else if (response.status === 401 || response.status === 400 || response.status === 403) {
        // Production backend explicitly rejected credentials
        const result = await response.json().catch(() => ({}));
        this.registerFailedAttempt();
        return {
          success: false,
          error: result.error || 'Invalid password. Access denied for unauthorised entry.',
        };
      }
    } catch {
      // Backend unreachable (offline or running in standalone Vite preview without serverless function)
      // Fall through to client verification.
    }

    // 2. Client-side Verification Fallback
    const envPass = (import.meta as any).env?.VITE_OWNER_PASSWORD;
    const envPassHash = (import.meta as any).env?.VITE_OWNER_PASSWORD_HASH;

    let isMatch = false;

    // Check direct match if VITE_OWNER_PASSWORD was supplied during build
    if (envPass && cleanPass === envPass) {
      isMatch = true;
    }

    // Secure cryptographic salted hash verification
    const enteredHash = await hashPassword(cleanPass);
    const customStoredHash = localStorage.getItem(CREDS_KEY);

    if (customStoredHash && enteredHash === customStoredHash) {
      isMatch = true;
    } else if (envPassHash && enteredHash === envPassHash) {
      isMatch = true;
    } else if (AUTHORIZED_SALTED_HASHES.includes(enteredHash)) {
      isMatch = true;
    }

    if (!isMatch) {
      this.registerFailedAttempt();
      return {
        success: false,
        error: 'Invalid password. Access denied for unauthorised entry.',
      };
    }

    // Reset failed counter upon successful login
    this.failedAttempts = 0;
    this.lockoutUntil = 0;

    // Issue secure persistent owner session
    const session: AuthSession = {
      token:
        'uy_auth_' +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days session
      userId: OWNER_USER.id,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.notify();

    return { success: true };
  }

  public logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  }

  public async changePassword(
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newPass || newPass.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters long.',
      };
    }

    const currentHash = await hashPassword(currentPass.trim());
    const customStoredHash = localStorage.getItem(CREDS_KEY);
    const isCurrentValid = customStoredHash
      ? currentHash === customStoredHash
      : AUTHORIZED_SALTED_HASHES.includes(currentHash);

    if (!isCurrentValid) {
      return {
        success: false,
        error: 'Current password does not match.',
      };
    }

    const newHash = await hashPassword(newPass.trim());
    localStorage.setItem(CREDS_KEY, newHash);
    return { success: true };
  }

  public getPendingReset(): PasswordResetRecord | null {
    try {
      const raw = localStorage.getItem(RESET_KEY);
      if (!raw) return null;
      const record: PasswordResetRecord = JSON.parse(raw);
      if (!record || Date.now() > record.expiresAt) {
        localStorage.removeItem(RESET_KEY);
        return null;
      }
      return record;
    } catch {
      return null;
    }
  }

  public cancelPasswordReset(): void {
    localStorage.removeItem(RESET_KEY);
  }

  public async requestPasswordReset(
    identifier: string
  ): Promise<{ success: boolean; record?: PasswordResetRecord; error?: string }> {
    const cleanId = (identifier || '').trim().toLowerCase();

    if (!cleanId) {
      return {
        success: false,
        error: 'Please enter your registered owner email address or username.',
      };
    }

    const validIdentifiers = [
      'uygarment942',
      'mrmubashir942@gmail.com',
      'owner',
      'admin',
      OWNER_EMAIL.toLowerCase(),
    ];

    if (!validIdentifiers.includes(cleanId)) {
      return {
        success: false,
        error: 'No registered owner account matches the provided email or username.',
      };
    }

    // Generate secure 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const maskedEmail = 'mr*******42@gmail.com';
    const record: PasswordResetRecord = {
      code,
      email: OWNER_EMAIL,
      maskedEmail,
      expiresAt,
      createdAt: Date.now(),
    };

    localStorage.setItem(RESET_KEY, JSON.stringify(record));

    return {
      success: true,
      record,
    };
  }

  public verifyResetCode(code: string): { success: boolean; error?: string } {
    const cleanCode = (code || '').trim();
    if (!cleanCode) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    const pending = this.getPendingReset();
    if (!pending) {
      return {
        success: false,
        error: 'Verification session has expired or does not exist. Please request a new code.',
      };
    }

    if (Date.now() > pending.expiresAt) {
      this.cancelPasswordReset();
      return {
        success: false,
        error: 'Verification code has expired. Please request a fresh code.',
      };
    }

    if (pending.code !== cleanCode) {
      return {
        success: false,
        error: 'Incorrect verification code. Please check your email and try again.',
      };
    }

    return { success: true };
  }

  public async resetPasswordWithCode(
    code: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const codeCheck = this.verifyResetCode(code);
    if (!codeCheck.success) {
      return codeCheck;
    }

    const cleanPass = (newPass || '').trim();
    if (!cleanPass || cleanPass.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters long.',
      };
    }

    const newHash = await hashPassword(cleanPass);
    localStorage.setItem(CREDS_KEY, newHash);
    localStorage.removeItem(RESET_KEY);

    // Reset any lockout state
    this.failedAttempts = 0;
    this.lockoutUntil = 0;

    return { success: true };
  }

  public subscribe(listener: (isAuthenticated: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const authed = this.isAuthenticated();
    this.listeners.forEach((cb) => cb(authed));
  }

  private registerFailedAttempt(): void {
    this.failedAttempts += 1;
    if (this.failedAttempts >= 5) {
      this.lockoutUntil = Date.now() + 30000; // 30 seconds cooldown
    }
  }

  // Permission checks - single authorised owner has full system access
  public canManageFinances(): boolean {
    return true;
  }

  public canManageProduction(): boolean {
    return true;
  }

  public canAdjustStock(): boolean {
    return true;
  }
}

export const auth = new AuthService();
