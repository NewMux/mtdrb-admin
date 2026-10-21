import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ConfirmActionModal from "../ConfirmActionModal";

const action = vi.fn();

function open(extra: Partial<React.ComponentProps<typeof ConfirmActionModal>> = {}) {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfirmActionModal
      isOpen
      onClose={onClose}
      onDone={onDone}
      title="Delete gym"
      subtitle="Iron Temple"
      description={<p>Gone forever.</p>}
      confirmLabel="Delete it"
      successMessage="Deleted"
      variant="danger"
      action={action}
      {...extra}
    />,
  );
  return { onDone, onClose };
}
const button = () => screen.getByRole("button", { name: "Delete it" });
const reason = (v: string) => fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: v } });
const typed = (v: string) => fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value: v } });

beforeEach(() => {
  vi.clearAllMocks();
  action.mockResolvedValue(undefined);
});

describe("ConfirmActionModal", () => {
  it("needs a reason of at least 3 characters before it enables", () => {
    open();
    expect(button()).toBeDisabled();
    reason("ab");
    expect(button()).toBeDisabled();
    reason("abc");
    expect(button()).toBeEnabled();
  });

  it("with a typed confirmation, stays disabled until it matches", () => {
    open({ confirmText: "Iron Temple", caseSensitive: true });
    reason("closing down");
    expect(button()).toBeDisabled();
    typed("iron temple");
    expect(button()).toBeDisabled(); // gym names are compared exactly
    typed("Iron Temple");
    expect(button()).toBeEnabled();
  });

  it("ignores case when asked to (emails)", () => {
    open({ confirmText: "Sam@X.dev" });
    reason("left the company");
    typed("sam@x.dev");
    expect(button()).toBeEnabled();
  });

  it("passes the reason and the checkbox to the action, then reports done", async () => {
    const { onDone } = open({ option: { label: "Also delete accounts" } });
    reason("  closing down  ");
    fireEvent.click(screen.getByLabelText(/also delete accounts/i));
    fireEvent.click(button());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(action).toHaveBeenCalledWith({ reason: "  closing down  ", option: true });
  });

  it("leaves the checkbox off by default", async () => {
    const { onDone } = open({ option: { label: "Also delete accounts" } });
    reason("closing down");
    fireEvent.click(button());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(action).toHaveBeenCalledWith({ reason: "closing down", option: false });
  });

  it("shows the database's error and does not report done", async () => {
    action.mockRejectedValue(new Error("Cancel this gym's Paddle subscription before deleting it"));
    const { onDone } = open();
    reason("closing down");
    fireEvent.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent("Paddle subscription");
    expect(onDone).not.toHaveBeenCalled();
    expect(button()).toBeEnabled(); // can retry
  });

  it("does not submit while disabled, even via the form", () => {
    open({ confirmText: "Iron Temple" });
    reason("closing down");
    // The submit button sits in the modal footer, tied to the form by its `form` attribute.
    const form = document.getElementById(button().getAttribute("form") as string) as HTMLFormElement;
    fireEvent.submit(form);
    expect(action).not.toHaveBeenCalled();
  });
});
