import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildChecklist, type ChecklistItem } from "../../../utils/setupChecklist";

const h = vi.hoisted(() => ({ items: null as ChecklistItem[] | null, tenantId: "t1" as string | null }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k} ${JSON.stringify(o)}` : k) }),
}));
vi.mock("../../../contexts/auth-context", () => ({ useAuth: () => ({ tenantId: h.tenantId }) }));
vi.mock("../../../hooks/useSetupProgress", () => ({ useSetupProgress: () => ({ items: h.items }) }));

import SetupChecklist from "../SetupChecklist";

const show = () =>
  render(
    <MemoryRouter>
      <SetupChecklist />
    </MemoryRouter>,
  );

beforeEach(() => {
  window.localStorage.clear();
  h.tenantId = "t1";
  h.items = buildChecklist({ configured: true, plans: 0, members: 0, classes: 0, invoices: 0 });
});

describe("SetupChecklist", () => {
  it("shows progress and links each open step to where it is done", () => {
    show();
    expect(screen.getByText(/setupChecklist.progress/)).toHaveTextContent('{"done":1,"total":5}');
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("link", { name: /items.member.title/ })).toHaveAttribute("href", "/dashboard/members");
  });

  it("renders nothing while the data is loading or unreadable", () => {
    h.items = null;
    const { container } = show();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once everything is done", () => {
    h.items = buildChecklist({ configured: true, plans: 1, members: 1, classes: 1, invoices: 1 });
    const { container } = show();
    expect(container).toBeEmptyDOMElement();
  });

  it("can be dismissed, and stays dismissed for that gym only", () => {
    const first = show();
    fireEvent.click(screen.getByRole("button", { name: "setupChecklist.dismiss" }));
    expect(first.container).toBeEmptyDOMElement();
    first.unmount();

    show();
    expect(screen.queryByRole("progressbar")).toBeNull();

    h.tenantId = "t2";
    render(
      <MemoryRouter>
        <SetupChecklist />
      </MemoryRouter>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
