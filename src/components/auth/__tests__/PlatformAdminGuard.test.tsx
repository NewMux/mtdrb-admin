import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PlatformAdminGuard from "../PlatformAdminGuard";

const mockUseAuth = vi.fn();
const mockUsePlatformAdmin = vi.fn();

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("../../../contexts/platform-admin-context", () => ({
  usePlatformAdmin: () => mockUsePlatformAdmin(),
}));
vi.mock("../../../pages/NotFound", () => ({
  default: () => <div>Page not found stub</div>,
}));
vi.mock("../MfaGate", () => ({
  default: ({ onVerified }: { onVerified: () => void }) => (
    <button onClick={() => onVerified()}>mfa gate stub</button>
  ),
}));

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return <div>login page, return to {from}</div>;
}

function renderGuard(path = "/superadmin/tenants") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route
          path="/superadmin/*"
          element={
            <PlatformAdminGuard>
              <div>Owner console</div>
            </PlatformAdminGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const signedIn = { user: { id: "u1", email: "o@x.dev" }, isLoading: false };
const refresh = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue(signedIn);
  mockUsePlatformAdmin.mockReturnValue({ state: { phase: "ok" }, refresh });
});

describe("PlatformAdminGuard", () => {
  it("shows a spinner, never the console, while auth or the status is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    const { unmount } = renderGuard();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
    unmount();

    mockUseAuth.mockReturnValue(signedIn);
    mockUsePlatformAdmin.mockReturnValue({ state: { phase: "loading" }, refresh });
    renderGuard();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
  });

  it("sends a logged-out visitor to /login and remembers where they were going", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockUsePlatformAdmin.mockReturnValue({ state: { phase: "not_admin" }, refresh });
    renderGuard("/superadmin/tenants");
    expect(screen.getByText(/login page, return to \/superadmin\/tenants/)).toBeInTheDocument();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
  });

  it("renders the ordinary 404 for a signed-in non-admin (existence not revealed)", () => {
    mockUsePlatformAdmin.mockReturnValue({ state: { phase: "not_admin" }, refresh });
    renderGuard();
    expect(screen.getByText("Page not found stub")).toBeInTheDocument();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
  });

  it("shows the MFA step for an allowlisted admin without a second factor, and re-checks after verifying", () => {
    mockUsePlatformAdmin.mockReturnValue({ state: { phase: "mfa_required" }, refresh });
    renderGuard();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("mfa gate stub"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows a retry screen on error - not the 404 and not the console", () => {
    mockUsePlatformAdmin.mockReturnValue({
      state: { phase: "error", message: "Timed out checking your access" },
      refresh,
    });
    renderGuard();
    expect(screen.getByText(/could not check your access/i)).toBeInTheDocument();
    expect(screen.getByText("Timed out checking your access")).toBeInTheDocument();
    expect(screen.queryByText("Page not found stub")).not.toBeInTheDocument();
    expect(screen.queryByText("Owner console")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders the console only for status ok", () => {
    renderGuard();
    expect(screen.getByText("Owner console")).toBeInTheDocument();
  });
});
