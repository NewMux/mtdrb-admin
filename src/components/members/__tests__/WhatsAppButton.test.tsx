import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const toastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  toast: Object.assign(vi.fn(), { error: (...a: unknown[]) => toastError(...a), success: vi.fn() }),
  default: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() },
}));
vi.mock("../../../supabaseClient", () => ({ supabase: {} }));

import "../../../i18n";
import { WhatsAppButton } from "../SmartMemberTable";

type MemberProp = Parameters<typeof WhatsAppButton>[0]["member"];
const member = (over: Partial<MemberProp> = {}): MemberProp =>
  ({
    id: "m1",
    name: "Amal",
    phone: "+973 3600 0000",
    planEnd: "",
    lastCheckIn: "",
    ...over,
  }) as MemberProp;

let open: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  open = vi.fn();
  vi.stubGlobal("open", open);
});

const send = () => fireEvent.click(screen.getByRole("button"));

describe("WhatsAppButton", () => {
  it("does not send a renewal reminder when the member has no expiry date on record", () => {
    render(<WhatsAppButton member={member({ planEnd: "" })} template="expiry" />);
    send();
    expect(open).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("no membership expiry date"));
  });

  it("sends the renewal reminder, with the real days left, when there is an expiry date", () => {
    const planEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    render(<WhatsAppButton member={member({ planEnd })} template="expiry" />);
    send();
    expect(open).toHaveBeenCalledTimes(1);
    const url = String(open.mock.calls[0][0]);
    expect(url).toContain("wa.me/97336000000");
    expect(decodeURIComponent(url)).toMatch(/expires in [45] days/);
  });

  it("other messages do not need an expiry date", () => {
    render(<WhatsAppButton member={member({ planEnd: "" })} template="inactive" />);
    send();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("still refuses when there is no phone number", () => {
    render(<WhatsAppButton member={member({ phone: "" })} template="custom" />);
    send();
    expect(open).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
  });
});
