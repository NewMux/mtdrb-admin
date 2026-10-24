import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const listActivePlans = vi.fn();
const assignMemberPlan = vi.fn();
vi.mock("../../../../api/membershipPlans", () => ({
  listActivePlans: (...a: unknown[]) => listActivePlans(...a),
  assignMemberPlan: (...a: unknown[]) => assignMemberPlan(...a),
  PLAN_PAYMENT_METHODS: ["cash", "card", "bank_transfer", "online", "other"],
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
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p1", { renew: true, price: 20.5, invoice: true, paymentMethod: "cash" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(result));
  });

  it("lets the owner start fresh instead, and change the price", async () => {
    open(future);
    await screen.findByRole("option", { name: "Yearly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p2" } });
    fireEvent.click(screen.getByLabelText("membershipPlans.continueFromEnd"));
    fireEvent.change(screen.getByDisplayValue("200.000"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p2", { renew: false, price: 150, invoice: true, paymentMethod: "cash" }));
  });

  it("never offers to continue from an end date that has already passed", async () => {
    open("2020-01-01");
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p1" } });
    expect(screen.queryByLabelText("membershipPlans.continueFromEnd")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenCalledWith("m1", "p1", { renew: false, price: 20.5, invoice: true, paymentMethod: "cash" }));
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

  it("can skip the invoice and records how it was paid otherwise", async () => {
    open(null);
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("membershipPlans.paymentMethod"), { target: { value: "card" } });
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenLastCalledWith("m1", "p1", { renew: false, price: 20.5, invoice: true, paymentMethod: "card" }));

    fireEvent.click(screen.getByLabelText("membershipPlans.recordSale"));
    expect(screen.queryByLabelText("membershipPlans.paymentMethod")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenLastCalledWith("m1", "p1", expect.objectContaining({ invoice: false })));
  });

  it("never offers an invoice for a free plan", async () => {
    open(null);
    await screen.findByRole("option", { name: "Monthly" });
    fireEvent.change(screen.getByLabelText("membershipPlans.selectPlan"), { target: { value: "p1" } });
    fireEvent.change(screen.getByDisplayValue("20.500"), { target: { value: "0" } });
    expect(screen.getByText("membershipPlans.freeNoInvoice")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "membershipPlans.save" }));
    await waitFor(() => expect(assignMemberPlan).toHaveBeenLastCalledWith("m1", "p1", expect.objectContaining({ price: 0, invoice: false })));
  });
});
