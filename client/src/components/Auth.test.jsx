import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Auth from "./Auth.jsx";

const catalog = { countries: ["India", "France", "Germany"] };
const base = { catalog, onLogin: vi.fn(), onRegister: vi.fn(), busy: false, error: null, theme: "light", toggleTheme: vi.fn() };

describe("<Auth />", () => {
  it("renders the sign-in form by default with labelled fields", () => {
    render(<Auth {...base} />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls onLogin with the entered credentials", () => {
    const onLogin = vi.fn();
    render(<Auth {...base} onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onLogin).toHaveBeenCalledWith({ email: "a@b.com", password: "password123" });
  });

  it("switches to the register form and shows the country selector", () => {
    render(<Auth {...base} />);
    fireEvent.click(screen.getByRole("button", { name: "Create one" }));
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Country / region")).toBeInTheDocument();
  });

  it("toggles the theme when the theme button is clicked", () => {
    const toggleTheme = vi.fn();
    render(<Auth {...base} toggleTheme={toggleTheme} />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(toggleTheme).toHaveBeenCalled();
  });
});
