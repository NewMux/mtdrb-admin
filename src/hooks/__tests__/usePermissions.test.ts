import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import { UserRole } from "../../types/roles";

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("usePermissions", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Checks", () => {
    it("should correctly identify admin role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "admin" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "all" || perm === "read" || perm === "write"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isManager).toBe(true);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.isStaff).toBe(true);
      expect(result.current.userRole).toBe("admin");
    });

    it("should correctly identify manager role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "manager" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write" || perm === "manage_staff"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(true);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.isStaff).toBe(true);
      expect(result.current.userRole).toBe("manager");
    });

    it("should correctly identify trainer role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "trainer" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write_classes"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.isStaff).toBe(true);
      expect(result.current.userRole).toBe("trainer");
    });

    it("should correctly identify staff role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "staff" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isTrainer).toBe(false);
      expect(result.current.isStaff).toBe(true);
      expect(result.current.userRole).toBe("staff");
    });

    it("should default to staff when role is missing", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: null,
        hasPermission: vi.fn(() => false),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.userRole).toBe("staff");
      // When userMetadata is null, hasRoleAccess returns false, so isStaff will be false
      expect(result.current.isStaff).toBe(false);
    });
  });

  describe("Permission Checks", () => {
    it("should return correct permissions for admin", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "admin" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "all" || perm === "read" || perm === "write" || perm === "manage_staff" || perm === "write_classes"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canView).toBe(true);
      expect(result.current.canManageStaff).toBe(true);
      expect(result.current.canManageClasses).toBe(true);
    });

    it("should return correct permissions for manager", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "manager" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write" || perm === "manage_staff"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canView).toBe(true);
      expect(result.current.canManageStaff).toBe(true);
      expect(result.current.canManageClasses).toBe(false);
    });

    it("should return correct permissions for trainer", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "trainer" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write_classes"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canView).toBe(true);
      expect(result.current.canManageStaff).toBe(false);
      expect(result.current.canManageClasses).toBe(true);
    });

    it("should return correct permissions for staff", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "staff" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canView).toBe(true);
      expect(result.current.canManageStaff).toBe(false);
      expect(result.current.canManageClasses).toBe(false);
    });
  });

  describe("hasRoleAccess", () => {
    it("should allow access when user has required role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "admin" as UserRole },
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("staff")).toBe(true);
      expect(result.current.hasRoleAccess("trainer")).toBe(true);
      expect(result.current.hasRoleAccess("manager")).toBe(true);
      expect(result.current.hasRoleAccess("admin")).toBe(true);
    });

    it("should deny access when user has lower role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { role: "staff" as UserRole },
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("staff")).toBe(true);
      expect(result.current.hasRoleAccess("trainer")).toBe(false);
      expect(result.current.hasRoleAccess("manager")).toBe(false);
      expect(result.current.hasRoleAccess("admin")).toBe(false);
    });

    it("should return false when userMetadata is null", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: null,
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("staff")).toBe(false);
    });
  });
});

