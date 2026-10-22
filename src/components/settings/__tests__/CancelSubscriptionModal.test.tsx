import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const cancelSubscription = vi.fn();
vi.mock("../../../api/billing", () => ({ cancelSubscription: (...a: unknown[]) => cancelSubscription(...a) }));

const from = vi.fn();
const insert = vi.fn();
vi.mock("../../../supabaseClient", () => ({
  supabase: { from: (...a: unknown[]) => from(...a) },
}));
vi.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ tenantId: "tenant-1" }) }));

import "../../../i18n";
import CancelSubscriptionModal from "../CancelSubscriptionModal";

const END = "2026-11-20T10:00:00.000Z";

function open(props: Partial<React.ComponentProps<typeof CancelSubscriptionModal>> = {}) {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(<CancelSubscriptionModal isOpen onClose={onClose} currentPlan="starter" onSuccess={onSuccess} {...props} />);
  return { onSuccess, onClose };
}

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
// Steps animate in (AnimatePresence mode="wait"), so wait for each one to appear.
const clickWhenShown = async (name: RegExp | string) => fireEvent.click(await screen.findByRole("button", { name }));

/** Walk the three steps: continue, pick a reason, continue, type "cancel". */
async function reachConfirm() {
  click(/continue to cancel/i);
  await clickWhenShown("Too expensive");
  click(/^continue$/i);
  fireEvent.change(await screen.findByPlaceholderText("cancel"), { target: { value: "cancel" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockResolvedValue({ error: null });
  from.mockReturnValue({ insert });
  cancelSubscription.mockResolvedValue({ cancelAt: END, synced: true });
});

describe("CancelSubscriptionModal", () => {
  it("cancels through billing, never by writing the subscription row, then reports the end date", async () => {
    const { onSuccess } = open({ accessUntil: END });
    await reachConfirm();
    click(/^cancel subscription$/i);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(END));
    expect(cancelSubscription).toHaveBeenCalledTimes(1);
    // Only the audit trail is written from the browser, never platform_subscriptions.
    expect(from).toHaveBeenCalledWith("activities");
    expect(from).not.toHaveBeenCalledWith("platform_subscriptions");
  });

  it("records the reason in the activity log", async () => {
    const { onSuccess } = open();
    await reachConfirm();
    click(/^cancel subscription$/i);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant-1", metadata: expect.objectContaining({ reason: "too_expensive" }) }),
    );
  });

  it("tells the user the real access end date on the last step", async () => {
    open({ accessUntil: END });
    await reachConfirm();
    expect(screen.getByText(/keep full access until .* and won't be billed again/i)).toBeInTheDocument();
  });

  it("falls back to the general wording when the date is unknown", async () => {
    open();
    await reachConfirm();
    expect(screen.getByText(/access will continue until the end of your current billing period/i)).toBeInTheDocument();
  });

  it("shows billing's message and does not report success when it refuses", async () => {
    cancelSubscription.mockRejectedValue(new Error("Billing could not cancel your subscription, so nothing was changed."));
    const { onSuccess } = open();
    await reachConfirm();
    click(/^cancel subscription$/i);
    expect(await screen.findByText(/nothing was changed/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("will not cancel until 'cancel' is typed", async () => {
    open();
    click(/continue to cancel/i);
    await clickWhenShown("Too expensive");
    click(/^continue$/i);
    expect(await screen.findByRole("button", { name: /^cancel subscription$/i })).toBeDisabled();
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it("still succeeds if writing the audit entry fails", async () => {
    insert.mockRejectedValue(new Error("rls"));
    const { onSuccess } = open();
    await reachConfirm();
    click(/^cancel subscription$/i);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(END));
  });
});
