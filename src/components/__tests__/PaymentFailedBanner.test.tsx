import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const useSubscription = vi.fn();
vi.mock("../../contexts/SubscriptionContext", () => ({ useSubscription: () => useSubscription() }));

import "../../i18n";
import { PaymentFailedBanner } from "../PaymentFailedBanner";

const now = new Date("2026-11-03T12:00:00.000Z");
const withSub = (subscription: unknown) => useSubscription.mockReturnValue({ subscription });

describe("PaymentFailedBanner", () => {
  it("warns a gym that is inside its grace period, with the date", () => {
    withSub({ status: "past_due", grace_until: "2026-11-08T12:00:00.000Z" });
    render(<PaymentFailedBanner now={now} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't collect your latest subscription payment/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/before .*2026|before .*\d/);
  });

  it.each([
    ["an active subscription", { status: "active" }],
    ["a cancelled subscription", { status: "cancelled", grace_until: "2026-11-08T12:00:00.000Z" }],
    ["past_due with no grace date", { status: "past_due" }],
    ["past_due after the grace date", { status: "past_due", grace_until: "2026-11-01T00:00:00.000Z" }],
    ["past_due with an unreadable date", { status: "past_due", grace_until: "soon" }],
    ["no subscription", null],
  ])("shows nothing for %s", (_label, sub) => {
    withSub(sub);
    const { container } = render(<PaymentFailedBanner now={now} />);
    expect(container).toBeEmptyDOMElement();
  });
});
