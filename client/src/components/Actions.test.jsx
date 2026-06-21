import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Actions from "./Actions.jsx";

const catalog = {
  categories: { transport: { label: "Transport", color: "#2A9D8F" }, food: { label: "Food", color: "#6FA85B" } },
  actions: [
    { id: "transit", label: "Swap car trips for transit", saving: 300, icon: "Bus", cat: "transport" },
    { id: "redmeat", label: "Less red meat", saving: 350, icon: "Beef", cat: "food" },
  ],
};

describe("<Actions />", () => {
  it("lists the available actions", () => {
    render(<Actions catalog={catalog} pledges={[]} onToggle={vi.fn()} />);
    expect(screen.getByText("Swap car trips for transit")).toBeInTheDocument();
    expect(screen.getByText("Less red meat")).toBeInTheDocument();
  });

  it("calls onToggle with the action id when clicked", () => {
    const onToggle = vi.fn();
    render(<Actions catalog={catalog} pledges={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /Swap car trips for transit/ }));
    expect(onToggle).toHaveBeenCalledWith("transit");
  });

  it("sums the saving of pledged actions", () => {
    render(<Actions catalog={catalog} pledges={["transit"]} onToggle={vi.fn()} />);
    expect(screen.getByText("300 kg")).toBeInTheDocument();
  });
});
