import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const inviteGym = vi.fn();
vi.mock("../../../api/platformAdmin", () => ({ inviteGym: (...a: unknown[]) => inviteGym(...a) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import InviteGymModal from "../InviteGymModal";

function open() {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(<InviteGymModal isOpen onClose={onClose} onDone={onDone} />);
  return { onDone, onClose };
}
const send = () => screen.getByRole("button", { name: "Send invitation" });
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillAll = () => {
  fill(/gym name/i, "Iron Temple");
  fill(/admin email/i, "sara@iron.dev");
  fill(/reason/i, "Founding customer");
};

beforeEach(() => {
  vi.clearAllMocks();
  inviteGym.mockResolvedValue({ tenantId: "t9", userId: "u9", email: "sara@iron.dev" });
});

describe("InviteGymModal", () => {
  it("stays disabled until name, a valid email and a reason are given", () => {
    open();
    expect(send()).toBeDisabled();
    fill(/gym name/i, "Iron Temple");
    fill(/admin email/i, "not-an-email");
    fill(/reason/i, "Founding customer");
    expect(send()).toBeDisabled();
    fill(/admin email/i, "sara@iron.dev");
    expect(send()).toBeEnabled();
    fill(/reason/i, "ab");
    expect(send()).toBeDisabled();
  });

  it("defaults to Pro for 30 days and says when free access ends", () => {
    open();
    expect(screen.getByLabelText(/^plan$/i)).toHaveValue("pro");
    expect(screen.getByLabelText(/free access for/i)).toHaveValue("30d");
    expect(screen.getByText(/free access ends/i)).toBeInTheDocument();
  });

  it("offers time-limited access only (no expiry stays on the gym's own dialog)", () => {
    open();
    const options = Array.from(screen.getByLabelText(/free access for/i).querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["14 days", "30 days", "90 days", "1 year"]);
  });

  it("sends the invitation with a computed end date, then reports the new gym", async () => {
    const { onDone } = open();
    fillAll();
    fill(/^plan$/i, "starter");
    fill(/free access for/i, "90d");
    fireEvent.click(send());
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ tenantId: "t9", userId: "u9", email: "sara@iron.dev" }));
    const args = inviteGym.mock.calls[0][0];
    expect(args).toMatchObject({ gymName: "Iron Temple", adminEmail: "sara@iron.dev", planTier: "starter", reason: "Founding customer" });
    const days = (Date.parse(args.until) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(89.9);
    expect(days).toBeLessThan(90.1);
  });

  it("shows the service's refusal and lets the owner fix it and retry", async () => {
    inviteGym.mockRejectedValueOnce(new Error("That email already has an account."));
    const { onDone } = open();
    fillAll();
    fireEvent.click(send());
    expect(await screen.findByRole("alert")).toHaveTextContent("already has an account");
    expect(onDone).not.toHaveBeenCalled();
    fill(/admin email/i, "other@iron.dev");
    fireEvent.click(send());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
