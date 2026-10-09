import { AppUser } from '../types';

export const USERS: AppUser[] = [
  {
    id: 'user-1',
    username: 'owner',
    name: 'Mubashir Umar (Managing Director)',
    role: 'Owner',
  },
  {
    id: 'user-2',
    username: 'manager',
    name: 'Asif Khan (Factory Manager)',
    role: 'Factory Manager',
  },
  {
    id: 'user-3',
    username: 'accounts',
    name: 'Farhan Ali (Accounts Officer)',
    role: 'Accounts Staff',
  },
  {
    id: 'user-4',
    username: 'supervisor',
    name: 'Tariq Jameel (Floor Supervisor)',
    role: 'Supervisor',
  },
];

const AUTH_KEY = 'uy_garments_current_user';

export class AuthService {
  private currentUser: AppUser;
  private listeners: Set<(user: AppUser) => void> = new Set();

  constructor() {
    this.currentUser = this.loadUser();
  }

  private loadUser(): AppUser {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const found = USERS.find((u) => u.id === JSON.parse(saved).id);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return USERS[0]; // Default to Owner
  }

  public getCurrentUser(): AppUser {
    return this.currentUser;
  }

  public switchUser(userId: string): void {
    const user = USERS.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      this.listeners.forEach((cb) => cb(user));
    }
  }

  public subscribe(listener: (user: AppUser) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public canManageFinances(): boolean {
    return this.currentUser.role === 'Owner' || this.currentUser.role === 'Accounts Staff';
  }

  public canManageProduction(): boolean {
    return (
      this.currentUser.role === 'Owner' ||
      this.currentUser.role === 'Factory Manager' ||
      this.currentUser.role === 'Supervisor'
    );
  }

  public canAdjustStock(): boolean {
    return this.currentUser.role === 'Owner' || this.currentUser.role === 'Factory Manager';
  }
}

export const auth = new AuthService();
