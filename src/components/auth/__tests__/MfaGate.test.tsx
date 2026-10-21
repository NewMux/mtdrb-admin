import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MfaGate from "../MfaGate";

const mfa = {
  listFactors: vi.fn(),
  unenroll: vi.fn(),
  enroll: vi.fn(),
  challengeAndVerify: vi.fn(),
};
const refreshSession = vi.fn();
const signOut = vi.fn();

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: (...a: unknown[]) => mfa.listFactors(...a),
        unenroll: (...a: unknown[]) => mfa.unenroll(...a),
        enroll: (...a: unknown[]) => mfa.enroll(...a),
        challengeAndVerify: (...a: unknown[]) => mfa.challengeAndVerify(...a),
      },
      refreshSession: (...a: unknown[]) => refreshSession(...a),
    },
  },
}));
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "owner@x.dev" }, signOut }),
}));

const verifiedFactor = { id: "f-verified", status: "verified", factor_type: "totp" };
const staleFactor = { id: "f-stale", status: "unverified", factor_type: "totp" };

const factors = (all: unknown[]) => ({
  data: {
    all,
    totp: (all as Array<{ status: string }>).filter((f) => f.status === "verified"),
    phone: [],
  },
  error: null,
});

async function typeCodeAndSubmit(code: string, buttonName: RegExp) {
  fireEvent.change(screen.getByLabelText(/6-digit code/i), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: buttonName }));
}

beforeEach(() => {
  vi.clearAllMocks();
  refreshSession.mockResolvedValue({ error: null });
  mfa.unenroll.mockResolvedValue({ data: {}, error: null });
  mfa.challengeAndVerify.mockResolvedValue({ data: {}, error: null });
});

describe("MfaGate", () => {
  it("asks for a code only (no QR, no enrolment) when a verified factor exists", async () => {
    mfa.listFactors.mockResolvedValue(factors([verifiedFactor]));
    const onVerified = vi.fn();
    render(<MfaGate onVerified={onVerified} />);

    await screen.findByLabelText(/6-digit code/i);
    expect(mfa.enroll).not.toHaveBeenCalled();
    expect(screen.queryByAltText(/qr code/i)).not.toBeInTheDocument();

    await typeCodeAndSubmit("123 456", /^verify$/i);
    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
    expect(mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: "f-verified", code: "123456" });
    // aal2 must be in the stored token before the guard re-checks.
    expect(refreshSession).toHaveBeenCalled();
    expect(refreshSession.mock.invocationCallOrder[0]).toBeLessThan(onVerified.mock.invocationCallOrder[0]);
  });

  it("clears stale unverified factors, then enrols and shows the QR and manual secret", async () => {
    mfa.listFactors.mockResolvedValue(factors([staleFactor]));
    mfa.enroll.mockResolvedValue({
      data: { id: "f-new", totp: { qr_code: "data:image/svg+xml;utf8,<svg/>", secret: "JBSWY3DPEHPK3PXP" } },
      error: null,
    });
    const onVerified = vi.fn();
    render(<MfaGate onVerified={onVerified} />);

    expect(await screen.findByAltText(/qr code/i)).toBeInTheDocument();
    expect(screen.getByTestId("mfa-secret")).toHaveTextContent("JBSWY3DPEHPK3PXP");
    expect(mfa.unenroll).toHaveBeenCalledWith({ factorId: "f-stale" });
    expect(mfa.enroll).toHaveBeenCalledTimes(1);
    expect(mfa.enroll.mock.calls[0][0]).toMatchObject({ factorType: "totp" });

    await typeCodeAndSubmit("654321", /turn on and continue/i);
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
    expect(mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: "f-new", code: "654321" });
  });

  it("rejects a malformed code locally without calling the server", async () => {
    mfa.listFactors.mockResolvedValue(factors([verifiedFactor]));
    render(<MfaGate onVerified={vi.fn()} />);
    await screen.findByLabelText(/6-digit code/i);
    await typeCodeAndSubmit("12ab", /^verify$/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/6-digit code/i);
    expect(mfa.challengeAndVerify).not.toHaveBeenCalled();
  });

  it("keeps the user on the gate with a clear message on a wrong code", async () => {
    mfa.listFactors.mockResolvedValue(factors([verifiedFactor]));
    mfa.challengeAndVerify.mockResolvedValue({ data: null, error: { message: "Invalid TOTP code entered", status: 400 } });
    const onVerified = vi.fn();
    render(<MfaGate onVerified={onVerified} />);
    await screen.findByLabelText(/6-digit code/i);
    await typeCodeAndSubmit("000000", /^verify$/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/did not match/i);
    expect(onVerified).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/6-digit code/i)).toHaveValue("");
  });

  it("locks the form for a cooldown after a rate-limit response", async () => {
    mfa.listFactors.mockResolvedValue(factors([verifiedFactor]));
    mfa.challengeAndVerify.mockResolvedValue({ data: null, error: { message: "Request rate limit reached", status: 429 } });
    render(<MfaGate onVerified={vi.fn()} />);
    await screen.findByLabelText(/6-digit code/i);
    await typeCodeAndSubmit("111111", /^verify$/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
    expect(screen.getByRole("button", { name: /^verify$/i })).toBeDisabled();
    expect(screen.getByText(/try again in \d+s/i)).toBeInTheDocument();
  });

  it("explains how to fix it when TOTP is switched off for the project", async () => {
    mfa.listFactors.mockResolvedValue(factors([]));
    mfa.enroll.mockResolvedValue({ data: null, error: { message: "MFA enroll is disabled for TOTP" } });
    render(<MfaGate onVerified={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/enable totp in supabase/i);
  });

  it("offers sign out", async () => {
    mfa.listFactors.mockResolvedValue(factors([verifiedFactor]));
    render(<MfaGate onVerified={vi.fn()} />);
    await screen.findByLabelText(/6-digit code/i);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(signOut).toHaveBeenCalled();
  });
});
