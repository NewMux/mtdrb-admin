import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseAuth = vi.fn();
vi.mock("../../../contexts/AuthContext", () => ({ useAuth: () => mockUseAuth() }));

import Can from "../Can";

describe("Can", () => {
  it("shows its children when the person's role allows it, and hides them otherwise", () => {
    mockUseAuth.mockReturnValue({ can: (p: string) => p === "members.manage" });
    const { rerender } = render(<Can permission="members.manage"><button>Import</button></Can>);
    expect(screen.getByText("Import")).toBeInTheDocument();
    rerender(<Can permission="billing.manage"><button>Import</button></Can>);
    expect(screen.queryByText("Import")).not.toBeInTheDocument();
  });
});
