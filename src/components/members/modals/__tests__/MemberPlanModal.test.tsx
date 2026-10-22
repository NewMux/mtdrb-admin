import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const listActivePlans = vi.fn();
const assignMemberPlan = vi.fn();
vi.mock("../../../../api/membershipPlans", () => ({
  listActivePlans: (...a: unknown[]) => listActivePlans(...a),
  assignMemberPlan: (...a: unknown[]) => assignMemberPlan(...a),
}));
vi.mock("../../../../contexts/AuthContext", () => ({ useAuth: () => ({ tenantId: "t1" }) }));
vi.mock("../../../../contexts/gym-config-context", () => ({ useGymConfig: () => ({ config: { currency: "BHD" } }) }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, opts?: Record<string, unknown> | string) =>
      typeof opts === "string" ? opts : opts && "date" in opts ? `${key} ${opts.date}` : key,
  }),
}));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import MemberPlanModal from "../MemberPlanModal";

const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
const plans = [
  { id: "p1", name: "Monthly", price: 20.5, duration: 30 },
  { id: "p2", name: "Yearly", price: 200, duration: 365 },
];
const result = { memberId: "m1", planId: "p1", planName: "Monthly", startDate: "x", expiryDate: "2026-12-01", price: 20.5, renewed: true };

beforeEach(() => {
  vi.clearAllMocks();
  listActivePlans.mockResolvedValue(plans);
  assignMemberPlan.mockResolvedValue(result);
});

const open = (planEnd: string | null) => {
  const onDone = vi.fn();
  render(<MemberPlanModal isOpen onClose={vi.fn()} member={{ id: "m1", name: "Sara", planEnd }} onDone={onDone} />);
  return onDone;
};

describe("MemberPlanModal", () => {
  it("fills the price from the plan (to the currency's decimals) and renews from the current end", async () => {
    const onDone = open(future);
    const select = await screen.findByLabelText("membershipPlans.selectPlan");
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(select, { target: { value: "p1" } });
    expect(screen.getByDisplayValue("20.500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p1", { renew: true, price: 20.5 }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(result));
  });

  it("lets the owner start fresh instead, and change the price", async () => {
    open(future);
    await screen.findByRole("option", { name: "Yearly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByDisplayValue("200.000"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p2", { renew: false, price: 150 }));
  });

  it("never offers to continue from an end date that has already passed", async () => {
    open("2020-01-01");
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p1" } });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p1", { renew: false, price: 20.5 }));
  });

  it("shows the database's error and does not close", async () => {
    assignMemberPlan.mockRejectedValue(new Error("This plan is not active"));
    const onDone = open(null);
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This plan is not active");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("tells the owner to create a plan when there are none", async () => {
    listActivePlans.mockResolvedValue([]);
    open(null);
    expect(await screen.findByText("membershipPlans.noPlansHint")).toBeInTheDocument();
  });
});
