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
        userMetadata: { tenant_id: "tenant-a", role: "admin" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "all" || perm === "read" || perm === "write"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isEmployee).toBe(true);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.userRole).toBe("admin");
    });

    it("should correctly identify employee role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "employee" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write" || perm === "manage_staff"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEmployee).toBe(true);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.userRole).toBe("employee");
    });

    it("should correctly identify trainer role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "trainer" as UserRole },
        hasPermission: vi.fn((perm: string) => perm === "read" || perm === "write_classes"),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEmployee).toBe(false);
      expect(result.current.isTrainer).toBe(true);
      expect(result.current.userRole).toBe("trainer");
    });

    it("should fail closed when membership context is missing", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: null,
        hasPermission: vi.fn(() => false),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.userRole).toBeUndefined();
      // When membership context is null, all role access remains denied.
      expect(result.current.isTrainer).toBe(false);
    });
  });

  describe("Permission Checks", () => {
    it("should return correct permissions for admin", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "admin" as UserRole },
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

    it("should return correct permissions for employee", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "employee" as UserRole },
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
        userMetadata: { tenant_id: "tenant-a", role: "trainer" as UserRole },
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
  });

  describe("hasRoleAccess", () => {
    it("should allow access when user has required role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "admin" as UserRole },
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("trainer")).toBe(true);
      expect(result.current.hasRoleAccess("employee")).toBe(true);
      expect(result.current.hasRoleAccess("admin")).toBe(true);
    });

    it("should deny access when user has lower role", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: { tenant_id: "tenant-a", role: "trainer" as UserRole },
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("trainer")).toBe(true);
      expect(result.current.hasRoleAccess("employee")).toBe(false);
      expect(result.current.hasRoleAccess("admin")).toBe(false);
    });

    it("should return false when userMetadata is null", () => {
      mockUseAuth.mockReturnValue({
        userMetadata: null,
        hasPermission: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasRoleAccess("trainer")).toBe(false);
    });
  });
});
