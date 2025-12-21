import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PermissionGuard from "../PermissionGuard";
import { UserRole } from "../../../types/roles";

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Helper to render with providers
const renderWithProviders = (
  ui: React.ReactElement,
  authValue: any = { userMetadata: null, isLoading: false }
) => {
  mockUseAuth.mockReturnValue(authValue);

  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe("PermissionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userMetadata: null, isLoading: false });
  });

  describe("Loading State", () => {
    it("should show loading spinner when auth is loading", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="staff">
          <div>Protected Content</div>
        </PermissionGuard>,
        { userMetadata: null, isLoading: true }
      );

      // Check for loading spinner (the div with animate-spin class)
      const loadingElement = document.querySelector(".animate-spin");
      expect(loadingElement).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Unauthenticated Users", () => {
    it("should redirect to fallback path when user is not authenticated", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="staff" fallbackPath="/login">
          <div>Protected Content</div>
        </PermissionGuard>,
        { userMetadata: null, isLoading: false }
      );

      // Should redirect or show auth required message
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should show authentication required message when no fallback path", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="staff">
          <div>Protected Content</div>
        </PermissionGuard>,
        { userMetadata: null, isLoading: false }
      );

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Role-Based Access Control", () => {
    it("should allow access when user has required role", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="staff">
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "staff" as UserRole },
          isLoading: false,
        }
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow access when user has higher role", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="trainer">
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "admin" as UserRole },
          isLoading: false,
        }
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should deny access when user has lower role", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="admin">
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "staff" as UserRole },
          isLoading: false,
        }
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it("should show correct role information in error message", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="admin">
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "staff" as UserRole },
          isLoading: false,
        }
      );

      // Check for access denied message
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      // Check role information is displayed (case-insensitive)
      expect(screen.getByText(/required role/i)).toBeInTheDocument();
    });
  });

  describe("Fallback Path", () => {
    it("should redirect to fallback path when user lacks permission", () => {
      renderWithProviders(
        <PermissionGuard requiredRole="admin" fallbackPath="/dashboard">
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "staff" as UserRole },
          isLoading: false,
        }
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Custom Unauthorized Component", () => {
    it("should render custom unauthorized component when provided", () => {
      renderWithProviders(
        <PermissionGuard
          requiredRole="admin"
          unauthorizedComponent={<div>Custom Unauthorized Message</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>,
        {
          userMetadata: { role: "staff" as UserRole },
          isLoading: false,
        }
      );

      expect(screen.getByText("Custom Unauthorized Message")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Role Hierarchy", () => {
    const roleTests: Array<{
      userRole: UserRole;
      requiredRole: UserRole;
      shouldAllow: boolean;
    }> = [
      { userRole: "owner", requiredRole: "staff", shouldAllow: true },
      { userRole: "admin", requiredRole: "manager", shouldAllow: true },
      { userRole: "manager", requiredRole: "trainer", shouldAllow: true },
      { userRole: "trainer", requiredRole: "staff", shouldAllow: true },
      { userRole: "staff", requiredRole: "trainer", shouldAllow: false },
      { userRole: "trainer", requiredRole: "manager", shouldAllow: false },
      { userRole: "manager", requiredRole: "admin", shouldAllow: false },
      { userRole: "admin", requiredRole: "owner", shouldAllow: false },
    ];

    roleTests.forEach(({ userRole, requiredRole, shouldAllow }) => {
      it(`should ${shouldAllow ? "allow" : "deny"} access for ${userRole} accessing ${requiredRole}`, () => {
        renderWithProviders(
          <PermissionGuard requiredRole={requiredRole}>
            <div>Protected Content</div>
          </PermissionGuard>,
          {
            userMetadata: { role: userRole },
            isLoading: false,
          }
        );

        if (shouldAllow) {
          expect(screen.getByText("Protected Content")).toBeInTheDocument();
        } else {
          expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
        }
      });
    });
  });
});

