import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "@/app/forgot-password/page";
import ResetPasswordPage from "@/app/reset-password/page";
import { LoginScreen } from "@/components/mobile/screens/LoginScreen";
import { RegisterScreen } from "@/components/mobile/screens/RegisterScreen";
import { fakeAuth } from "../supabaseMock";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

const profile = { id: "u1", fullName: "Jane Wanjiru", email: "jane@example.com", phone: "+254712345678", role: "customer" };

beforeEach(() => {
  replace.mockClear();
  window.history.replaceState(null, "", "/");
});

describe("Login", () => {
  it("signs in and continues to the page that sent the visitor", async () => {
    window.history.replaceState(null, "", "/login?next=%2Fnew-order");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })));
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email address"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!Pass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/new-order"));
  });

  it("shows wrong-password errors in red", async () => {
    fakeAuth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Invalid login credentials" } });
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email address"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Incorrect email or password.")).toHaveClass("text-rose-700");
    expect(replace).not.toHaveBeenCalled();
  });

  it("offers Google, Facebook and Apple", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    for (const provider of ["Google", "Facebook", "Apple"]) {
      expect(screen.getByRole("button", { name: `Continue with ${provider}` })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "Continue with Facebook" }));
    expect(fakeAuth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: "facebook" }));
  });
});

describe("Register", () => {
  it("asks the new user to confirm their email", async () => {
    const user = userEvent.setup();
    render(<RegisterScreen />);

    await user.type(screen.getByLabelText("Full name"), "Jane Wanjiru");
    await user.type(screen.getByLabelText("Phone"), "0712 345 678");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!Pass");
    await user.type(screen.getByLabelText("Confirm password"), "Str0ng!Pass");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("signs riders up as riders, including through social logins", async () => {
    const user = userEvent.setup();
    render(<RegisterScreen role="rider" />);
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(fakeAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ redirectTo: "http://localhost:3000/auth/callback?role=rider" }) }),
    );
  });
});

describe("Password reset", () => {
  it("sends the reset email without revealing whether the account exists", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("Email address"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText(/If an account exists for jane@example.com/)).toBeInTheDocument();
    expect(fakeAuth.resetPasswordForEmail).toHaveBeenCalled();
  });

  it("rejects an expired link", async () => {
    window.history.replaceState(null, "", "/reset-password?code=old");
    fakeAuth.exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { message: "Token has expired" } });
    fakeAuth.session = null;
    render(<ResetPasswordPage />);

    expect(await screen.findByRole("heading", { name: "Link expired" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send a new link" })).toHaveAttribute("href", "/forgot-password");
  });

  it("sets the new password from a valid link and signs the user in", async () => {
    window.history.replaceState(null, "", "/reset-password?code=good");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })));
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const password = await screen.findByLabelText("New password");
    // The one-time code is removed from the address bar once used.
    expect(window.location.search).toBe("");
    await user.type(password, "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await user.click(screen.getByRole("button", { name: "Save new password" }));
    expect(screen.getByText(/Use at least 8 characters/)).toBeInTheDocument();
    expect(fakeAuth.updateUser).not.toHaveBeenCalled();

    await user.clear(password);
    await user.type(password, "N3w!Password");
    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(screen.getByLabelText("Confirm new password"), "N3w!Password");
    await user.click(screen.getByRole("button", { name: "Save new password" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/customer-dashboard"));
    expect(fakeAuth.updateUser).toHaveBeenCalledWith({ password: "N3w!Password" });
  });
});
