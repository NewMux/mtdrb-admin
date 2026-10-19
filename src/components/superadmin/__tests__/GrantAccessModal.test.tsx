import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const grantAccess = vi.fn();
vi.mock("../../../api/platformAdmin", () => ({ grantAccess: (...a: unknown[]) => grantAccess(...a) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import GrantAccessModal from "../GrantAccessModal";

const awaiting = { id: "t1", name: "Iron Temple", subscription: null, accessState: "awaiting_activation" as const };

function open(tenant = awaiting) {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(<GrantAccessModal isOpen tenant={tenant} onClose={onClose} onDone={onDone} />);
  return { onDone, onClose };
}
const submit = () => fireEvent.click(screen.getByRole("button", { name: /grant access|save access/i }));
const reason = (v: string) => fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: v } });

beforeEach(() => {
  vi.clearAllMocks();
  grantAccess.mockResolvedValue(undefined);
});

describe("GrantAccessModal", () => {
  it("defaults to Pro for 30 days and requires a reason", async () => {
    open();
    expect(screen.getByLabelText(/^Pro/)).toBeChecked();
    submit();
    expect(await screen.findByText(/short reason/i)).toBeInTheDocument();
    expect(grantAccess).not.toHaveBeenCalled();
  });

  it("labels tiers honestly: Starter and Demo have no Pro features", () => {
    open();
    expect(screen.getAllByText("Active, but no Pro features")).toHaveLength(2);
    expect(screen.getAllByText("Includes Pro features")).toHaveLength(2);
  });

  it("grants with a computed end date and the reason, then reports done", async () => {
    const { onDone } = open();
    reason("Founding customer");
    submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const args = grantAccess.mock.calls[0][0];
    expect(args).toMatchObject({ tenantId: "t1", planTier: "pro", reason: "Founding customer" });
    const days = (Date.parse(args.until) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it("makes no-expiry deliberate: the gym name must be typed", async () => {
    const { onDone } = open();
    fireEvent.click(screen.getByRole("button", { name: "No expiry" }));
    reason("Partner");
    submit();
    expect(await screen.findByText(/type the gym name to confirm access/i)).toBeInTheDocument();
    expect(grantAccess).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Iron Temple"), { target: { value: "iron temple" } });
    submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(grantAccess.mock.calls[0][0].until).toBeNull();
  });

  it("rejects a past custom date locally", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: /until a date/i }));
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: "2020-01-01" } });
    reason("Backdated");
    submit();
    expect(await screen.findByText(/must be in the future/i)).toBeInTheDocument();
    expect(grantAccess).not.toHaveBeenCalled();
  });

  it("shows the server's refusal and stays open", async () => {
    grantAccess.mockRejectedValue(new Error("This gym is billed through Paddle."));
    const { onDone } = open();
    reason("Try anyway");
    submit();
    expect(await screen.findByText(/billed through Paddle/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("warns when the gym has any Paddle history", () => {
    open({
      ...awaiting,
      accessState: "inactive" as never,
      subscription: { status: "cancelled", plan_tier: "pro", payment_provider: "paddle", trial_end: null, current_period_end: null },
    });
    expect(screen.getByText(/cancelled in Paddle first/i)).toBeInTheDocument();
  });
});
