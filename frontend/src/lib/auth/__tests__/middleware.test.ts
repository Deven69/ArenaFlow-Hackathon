import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  canAccessRoute,
  requireAuth,
  hasRole,
  isAuthenticated,
  setAuthUser,
  logout,
  getUserRole,
  type UserRole,
} from "../middleware";

describe("Middleware Role Routing", () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });
  });

  const setUser = (role: Exclude<UserRole, null> | null) => {
    if (role) {
      setAuthUser({
        id: "user-001",
        email: "test@example.com",
        role,
        name: "Test User",
      });
    } else {
      logout();
    }
  };

  describe("unauthenticated user redirects to login", () => {
    it("should redirect unauthenticated user from protected route to login", () => {
      setUser(null);

      const result = canAccessRoute("/tickets", null);

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/login");
      expect(result.statusCode).toBe(302);
    });

    it("should redirect to login for /profile when unauthenticated", () => {
      setUser(null);

      const result = canAccessRoute("/profile", null);

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });

    it("should allow access to /login when unauthenticated", () => {
      setUser(null);

      const result = canAccessRoute("/login", null);

      expect(result.allowed).toBe(true);
    });

    it("should return authentication required message", () => {
      setUser(null);

      const result = canAccessRoute("/tickets", null);

      expect(result.errorMessage).toBe("Authentication required");
    });

    it("should report not authenticated via isAuthenticated helper", () => {
      setUser(null);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("staff role redirects to scanner", () => {
    it("should allow staff to access /scanner", () => {
      setUser("staff");

      const result = canAccessRoute("/scanner", "staff");

      expect(result.allowed).toBe(true);
    });

    it("should redirect staff from /admin to /scanner", () => {
      setUser("staff");

      const result = canAccessRoute("/admin", "staff");

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/scanner");
      expect(result.statusCode).toBe(302);
    });

    it("should return appropriate message for staff admin access", () => {
      setUser("staff");

      const result = canAccessRoute("/admin", "staff");

      expect(result.errorMessage).toBe("Staff members cannot access admin area");
    });

    it("should allow staff to access /", () => {
      setUser("staff");

      const result = canAccessRoute("/", "staff");

      expect(result.allowed).toBe(true);
    });

    it("should report staff role via hasRole", () => {
      setUser("staff");

      expect(hasRole("staff")).toBe(true);
      expect(hasRole("admin")).toBe(false);
      expect(hasRole("fan")).toBe(false);
    });

    it("should redirect staff from /admin/dashboard to /scanner", () => {
      setUser("staff");

      const result = canAccessRoute("/admin/dashboard", "staff");

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/scanner");
    });
  });

  describe("fan trying to access /admin gets 403", () => {
    it("should return 403 when fan tries to access /admin", () => {
      setUser("fan");

      const result = canAccessRoute("/admin", "fan");

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("should not redirect fan from /admin", () => {
      setUser("fan");

      const result = canAccessRoute("/admin", "fan");

      expect(result.redirectTo).toBeUndefined();
    });

    it("should return access denied message for fan", () => {
      setUser("fan");

      const result = canAccessRoute("/admin", "fan");

      expect(result.errorMessage).toBe("Access denied. Admin privileges required.");
    });

    it("should return 403 for any /admin subroute", () => {
      setUser("fan");

      const result = canAccessRoute("/admin/users", "fan");

      expect(result.statusCode).toBe(403);
    });

    it("should allow fan to access /", () => {
      setUser("fan");

      const result = canAccessRoute("/", "fan");

      expect(result.allowed).toBe(true);
    });

    it("should allow fan to access /tickets", () => {
      setUser("fan");

      const result = canAccessRoute("/tickets", "fan");

      expect(result.allowed).toBe(true);
    });
  });

  describe("admin accessing /tickets gets redirected", () => {
    it("should redirect admin from /tickets to /admin", () => {
      setUser("admin");

      const result = canAccessRoute("/tickets", "admin");

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/admin");
      expect(result.statusCode).toBe(302);
    });

    it("should allow admin to access /admin", () => {
      setUser("admin");

      const result = canAccessRoute("/admin", "admin");

      expect(result.allowed).toBe(true);
    });

    it("should allow admin to access /scanner", () => {
      setUser("admin");

      const result = canAccessRoute("/scanner", "admin");

      expect(result.allowed).toBe(true);
    });

    it("should return appropriate redirect message", () => {
      setUser("admin");

      const result = canAccessRoute("/tickets", "admin");

      expect(result.errorMessage).toBe("Admins are redirected to admin dashboard");
    });

    it("should allow admin to access /", () => {
      setUser("admin");

      const result = canAccessRoute("/", "admin");

      expect(result.allowed).toBe(true);
    });

    it("should report admin role via hasRole", () => {
      setUser("admin");

      expect(hasRole("admin")).toBe(true);
      expect(hasRole("fan")).toBe(false);
    });
  });

  describe("requireAuth helper", () => {
    it("should use current user role for permission check", () => {
      setUser("fan");

      const result = requireAuth("/tickets");

      expect(result.allowed).toBe(true);
    });

    it("should require authentication", () => {
      setUser(null);

      const result = requireAuth("/tickets");

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });
  });

  describe("getUserRole helper", () => {
    it("should return null when no user is set", () => {
      setUser(null);

      expect(getUserRole()).toBeNull();
    });

    it("should return correct role when user is set", () => {
      setUser("staff");

      expect(getUserRole()).toBe("staff");
    });

    it("should handle invalid stored data gracefully", () => {
      mockLocalStorage["arenaFlow_user"] = "invalid json";

      expect(getUserRole()).toBeNull();
    });
  });

  describe("isAuthenticated helper", () => {
    it("should return true when user is authenticated", () => {
      setUser("fan");

      expect(isAuthenticated()).toBe(true);
    });

    it("should return false when user is not authenticated", () => {
      setUser(null);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("logout", () => {
    it("should remove user from storage", () => {
      setUser("admin");
      expect(isAuthenticated()).toBe(true);

      logout();

      expect(isAuthenticated()).toBe(false);
      expect(mockLocalStorage["arenaFlow_user"]).toBeUndefined();
    });
  });
});
