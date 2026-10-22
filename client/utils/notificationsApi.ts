import { authRequest } from "@/utils/apiClient";

export type NotificationEvent =
  | "order_placed"
  | "rescheduled"
  | "picked_up"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "payment_received";

export type ApiNotification = {
  id: string;
  order_id: string | null;
  event: NotificationEvent;
  message: string;
  /** Whether the update was also texted: skipped when SMS is off, unconfigured or the number is invalid. */
  sms_status: "sent" | "failed" | "skipped";
  read_at: string | null;
  created_at: string;
};

export type NotificationFeed = { notifications: ApiNotification[]; unread: number };

export type SmsPreferences = {
  phone: string;
  sms_opt_in: boolean;
  /** False when texts can't reach the saved number (not a Kenyan mobile). */
  phone_valid: boolean;
  /** False when the shop hasn't set up its SMS account yet. */
  sms_available: boolean;
};

/** How often the unread badge re-checks for new updates. */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

/** Fired on window after everything is marked read, so the sidebar badge clears at once. */
export const NOTIFICATIONS_READ_EVENT = "pl-notifications-read";

export function fetchNotifications() {
  return authRequest<NotificationFeed>("/api/notifications/mine");
}

export function markNotificationsRead() {
  return authRequest<{ unread: number }>("/api/notifications/read", { method: "POST" });
}

export function fetchSmsPreferences() {
  return authRequest<SmsPreferences>("/api/notifications/preferences");
}

export function updateSmsPreferences(changes: Partial<Pick<SmsPreferences, "phone" | "sms_opt_in">>) {
  return authRequest<SmsPreferences>("/api/notifications/preferences", { method: "PATCH", body: changes });
}

/** Strips the "Panda Laundry: " prefix the SMS carries, which is noise inside the app. */
export function notificationText(notification: Pick<ApiNotification, "message">) {
  return notification.message.replace(/^Panda Laundry:\s*/, "");
}

export const NOTIFICATION_TITLES: Record<NotificationEvent, string> = {
  order_placed: "Pickup booked",
  rescheduled: "Pickup rescheduled",
  picked_up: "Clothes collected",
  processing: "Weighed & cleaning",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Order cancelled",
  payment_received: "Payment received",
};
