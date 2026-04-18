export type UserRole = 'fan' | 'staff' | 'admin' | null;

export interface AuthUser {
  id: string;
  email: string;
  role: Exclude<UserRole, null>;
  name?: string;
}

export interface MiddlewareResult {
  allowed: boolean;
  redirectTo?: string;
  statusCode?: number;
  errorMessage?: string;
}

const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['fan', 'staff', 'admin'],
  '/tickets': ['fan'],
  '/admin': ['admin'],
  '/scanner': ['staff', 'admin'],
  '/profile': ['fan', 'staff', 'admin'],
  '/login': [null],
};

export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('arenaFlow_user');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr) as AuthUser;
    return user.role || null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('arenaFlow_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getUserRole() !== null;
}

export function hasRole(role: UserRole): boolean {
  const currentRole = getUserRole();
  if (role === null) return currentRole === null;
  return currentRole === role;
}

export function canAccessRoute(path: string, role: UserRole): MiddlewareResult {
  const exactMatch = ROUTE_PERMISSIONS[path];
  if (exactMatch) {
    if (exactMatch.includes(role)) {
      return { allowed: true };
    }
  }

  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route !== '/' && path.startsWith(route)) {
      if (allowedRoles.includes(role)) {
        return { allowed: true };
      }

      if (role === null) {
        return {
          allowed: false,
          redirectTo: '/login',
          statusCode: 302,
          errorMessage: 'Authentication required',
        };
      }

      if (!allowedRoles.includes(role)) {
        if (role === 'staff' && path.startsWith('/admin')) {
          return {
            allowed: false,
            redirectTo: '/scanner',
            statusCode: 302,
            errorMessage: 'Staff members cannot access admin area',
          };
        }

        if (role === 'fan' && path.startsWith('/admin')) {
          return {
            allowed: false,
            statusCode: 403,
            errorMessage: 'Access denied. Admin privileges required.',
          };
        }

        if (role === 'admin' && path === '/tickets') {
          return {
            allowed: false,
            redirectTo: '/admin',
            statusCode: 302,
            errorMessage: 'Admins are redirected to admin dashboard',
          };
        }

        return {
          allowed: false,
          statusCode: 403,
          errorMessage: 'Access denied for your role',
        };
      }
    }
  }

  return { allowed: true };
}

export function requireAuth(path: string): MiddlewareResult {
  const role = getUserRole();
  return canAccessRoute(path, role);
}

export function setAuthUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem('arenaFlow_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('arenaFlow_user');
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('arenaFlow_user');
}
