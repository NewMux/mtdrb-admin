import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({
  role: "admin" as "admin" | "employee",
  deleteAccount: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k} ${JSON.stringify(o)}` : k) }),
}));
vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("react-router-dom", async (orig) => ({ ...(await orig<typeof import("react-router-dom")>()), useNavigate: () => h.navigate }));
vi.mock("../../../contexts/auth-context", () => ({
  useAuth: () => ({
    user: { email: "Owner@Gym.test" },
    tenantId: "t1",
    userMetadata: { role: h.role },
  }),
}));
vi.mock("../../../api/accountDeletion", () => ({
  deleteAccount: (...a: unknown[]) => h.deleteAccount(...a),
  AccountDeletionError: class extends Error {},
}));
vi.mock("../../../supabaseClient", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: "Iron House" }, error: null }) }) }) }),
    auth: { signOut: (...a: unknown[]) => h.signOut(...a) },
  },
}));

import DataPrivacyTab from "../DataPrivacyTab";

const show = () => render(<MemoryRouter><DataPrivacyTab /></MemoryRouter>);

beforeEach(() => {
  h.role = "admin";
  h.deleteAccount.mockReset().mockResolvedValue({ deletedUsers: 2, filesRemoved: true, subscriptionCancelled: true });
  h.signOut.mockReset().mockResolvedValue({});
  h.navigate.mockReset();
});

describe("DataPrivacyTab", () => {
  it("an admin sees the export section and must type the gym's exact name before deleting", async () => {
    show();
    expect(screen.getByText("dataPrivacy.exportTitle")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /dataPrivacy.deleteGymButton/ });
    await screen.findByText(/Iron House/);
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/dataPrivacy.typeGymName/), { target: { value: "iron house" } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/dataPrivacy.typeGymName/), { target: { value: "Iron House" } });
    expect(button).toBeEnabled();
  });

  it("deletes the gym, signs out and leaves the app", async () => {
    show();
    await screen.findByText(/Iron House/);
    fireEvent.change(screen.getByLabelText(/dataPrivacy.typeGymName/), { target: { value: "Iron House" } });
    fireEvent.click(screen.getByRole("button", { name: /dataPrivacy.deleteGymButton/ }));
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith("/", { replace: true }));
    expect(h.deleteAccount).toHaveBeenCalledWith("gym", "Iron House");
    expect(h.signOut).toHaveBeenCalled();
  });

  it("stays signed in and shows the reason when the server refuses", async () => {
    h.deleteAccount.mockRejectedValue(new Error("Billing could not cancel your subscription"));
    show();
    await screen.findByText(/Iron House/);
    fireEvent.change(screen.getByLabelText(/dataPrivacy.typeGymName/), { target: { value: "Iron House" } });
    fireEvent.click(screen.getByRole("button", { name: /dataPrivacy.deleteGymButton/ }));
    await screen.findByRole("alert");
    expect(h.signOut).not.toHaveBeenCalled();
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it("staff see no export section and delete only their own account, confirmed by email", async () => {
    h.role = "employee";
    show();
    expect(screen.queryByText("dataPrivacy.exportTitle")).toBeNull();
    const button = screen.getByRole("button", { name: /dataPrivacy.deleteMeButton/ });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/dataPrivacy.typeEmail/), { target: { value: "owner@gym.test" } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(h.deleteAccount).toHaveBeenCalledWith("me", "owner@gym.test"));
  });
});
