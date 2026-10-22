import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/mobile/primitives";
import { NOTIFICATIONS_READ_EVENT } from "@/utils/notificationsApi";
import { saveSession } from "@/utils/session";
import { fakeAuth } from "../supabaseMock";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

function stubFeed(unread: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => new Response(JSON.stringify({ notifications: [], unread }), { status: 200 })),
  );
}

beforeEach(() => {
  saveSession({ email: "jane@example.com", fullName: "Jane Wanjiru", role: "customer" });
});

describe("customer sidebar", () => {
  it("replaces the top/bottom nav with a sidebar for customers", async () => {
    stubFeed(0);
    render(
      <AppShell active="orders">
        <p>Page body</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole("navigation", { name: "Main" });
    for (const label of ["Home", "Book a pickup", "My orders", "Updates", "Help & support", "Profile"]) {
      expect(within(sidebar).getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(within(sidebar).getByRole("link", { name: "My orders" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Jane Wanjiru")).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
    // Only one navigation landmark: no leftover tab bar.
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it.each([
    ["rider", "jobs", "Jobs", "Rider", ["Jobs", "Help & support", "Profile"]],
    ["shop", "map", "Live map", "Shop staff", ["Shop", "Live map", "Help & support", "Profile"]],
    ["admin", "payments", "Payments", "Admin", ["Shop", "Live map", "Pricing", "Payments", "Riders", "Help & support", "Profile"]],
  ] as const)("gives %s accounts the sidebar with their own links", (nav, active, activeLabel, workspace, labels) => {
    stubFeed(0);
    render(
      <AppShell active={active} nav={nav}>
        <p>Workspace</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole("navigation", { name: "Main" });
    expect(within(sidebar).getAllByRole("link").map((link) => link.textContent)).toEqual(labels);
    expect(within(sidebar).getByRole("link", { current: "page" })).toHaveTextContent(activeLabel);
    expect(screen.getByText(workspace)).toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    // Customer-only extras: no booking button, no updates bell, no notification polling.
    expect(screen.queryByRole("link", { name: "New order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Updates/ })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the unread count and clears it when updates are read", async () => {
    stubFeed(3);
    render(
      <AppShell active="home">
        <p />
      </AppShell>,
    );

    const updates = within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: /Updates/ });
    await waitFor(() => expect(updates).toHaveTextContent("3"));
    expect(screen.getByRole("link", { name: "Updates (3 unread)" })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    });
    expect(updates).not.toHaveTextContent("3");
  });

  it("opens the menu as a drawer and closes it with Escape or a link", async () => {
    stubFeed(0);
    const user = userEvent.setup();
    render(
      <AppShell active="home">
        <p />
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(drawer).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    // Navigation is stubbed in jsdom, so prevent the real page load and just check the drawer closes.
    const link = within(screen.getByRole("dialog", { name: "Menu" })).getByRole("link", { name: "Profile" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("logs out from the sidebar", async () => {
    stubFeed(0);
    const user = userEvent.setup();
    render(
      <AppShell active="home">
        <p />
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(fakeAuth.signOut).toHaveBeenCalled();
    expect(localStorage.getItem("pl_session")).toBeNull();
  });
});
