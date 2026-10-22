import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingModal } from "@/components/landing/BookingModal";
import { takeBookingDraft } from "@/utils/bookingDraft";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function setup(open = true) {
  const onClose = vi.fn();
  const utils = render(<BookingModal open={open} onClose={onClose} />);
  return { ...utils, onClose, user: userEvent.setup() };
}

describe("BookingModal", () => {
  it("renders nothing when closed", () => {
    setup(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows validation errors only after submitting", async () => {
    const { user } = setup();
    expect(screen.queryByText("Pickup location is required.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Pickup location is required.")).toBeInTheDocument();
    expect(screen.getByText("Select a service.")).toBeInTheDocument();
    expect(screen.getByText("Pick a date for pickup.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears a field's error once the user edits it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Pickup Location"), "K");
    expect(screen.queryByText("Pickup location is required.")).not.toBeInTheDocument();
  });

  it("saves the choices and continues to the booking form", async () => {
    push.mockClear();
    const { user, onClose } = setup();

    await user.type(screen.getByLabelText("Pickup Location"), "  Kilimani ");
    await user.selectOptions(screen.getByLabelText("Service"), "Dry Clean");
    await user.type(screen.getByLabelText("Pickup Date"), todayISO());
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClose).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/new-order");
    expect(takeBookingDraft()).toEqual({ service: "Dry Clean", location: "Kilimani", pickupDate: todayISO() });
    // The draft is handed over once.
    expect(takeBookingDraft()).toBeNull();
  });

  it("starts empty again after being reopened", async () => {
    const { user, rerender, onClose } = setup();
    await user.type(screen.getByLabelText("Pickup Location"), "Kilimani");
    rerender(<BookingModal open={false} onClose={onClose} />);
    rerender(<BookingModal open onClose={onClose} />);
    expect(screen.getByLabelText("Pickup Location")).toHaveValue("");
  });

  it("closes on Escape, the close button, and a backdrop click", async () => {
    const { user, onClose } = setup();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("locks page scroll while open", () => {
    const { rerender, onClose } = setup();
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<BookingModal open={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("");
  });
});
