"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BellIcon, PhoneIcon } from "@/components/mobile/icons";
import { AppShell, Badge, PageHeading, SoftCard } from "@/components/mobile/primitives";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { usePolledData } from "@/hooks/usePolledData";
import { formatDateTime } from "@/utils/ordersApi";
import {
  NOTIFICATIONS_READ_EVENT,
  NOTIFICATION_POLL_INTERVAL_MS,
  NOTIFICATION_TITLES,
  fetchNotifications,
  markNotificationsRead,
  notificationText,
} from "@/utils/notificationsApi";

export function NotificationsScreen() {
  const { data: feed, error, loading } = usePolledData(fetchNotifications, NOTIFICATION_POLL_INTERVAL_MS);
  const markedRead = useRef(false);

  // Opening the page counts as reading everything; unread items stay highlighted until the next visit.
  useEffect(() => {
    if (!feed || feed.unread === 0 || markedRead.current) return;
    markedRead.current = true;
    markNotificationsRead().then(
      () => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)),
      () => {
        markedRead.current = false;
      },
    );
  }, [feed]);

  const notifications = feed?.notifications ?? [];

  return (
    <AppShell active="updates" title="Updates" backHref="/customer-dashboard" backLabel="Dashboard">
      <PageHeading
        title="Updates"
        subtitle="Every step of your orders. We also text these to your phone."
        action={
          <Link href="/profile#sms" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800">
            <PhoneIcon className="h-4 w-4" />
            SMS settings
          </Link>
        }
      />

      {error && !feed ? <FormStatusMessage message={`Couldn't load your updates: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading updates…</p> : null}

      {feed && notifications.length === 0 ? (
        <SoftCard className="py-10 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <BellIcon className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No updates yet</p>
          <p className="mt-1 text-xs text-slate-500">Book a pickup and we&apos;ll keep you posted here and by SMS.</p>
        </SoftCard>
      ) : null}

      {notifications.length > 0 ? (
        <SoftCard padding="p-0" className="overflow-hidden lg:max-w-3xl">
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const unread = notification.read_at === null;
              const body = (
                <div className={`flex gap-3 px-4 py-3.5 transition ${unread ? "bg-blue-50/60" : ""} ${notification.order_id ? "hover:bg-slate-50" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-blue-600" : "bg-transparent"}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold text-slate-900">{NOTIFICATION_TITLES[notification.event] ?? "Update"}</p>
                      {notification.sms_status === "sent" ? <Badge text="Texted" tone="green" /> : null}
                      {unread ? <span className="sr-only">(unread)</span> : null}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{notificationText(notification)}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(notification.created_at)}</p>
                  </div>
                </div>
              );

              return (
                <li key={notification.id}>
                  {notification.order_id ? (
                    <Link href={`/order-tracking?id=${notification.order_id}`} className="block">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </SoftCard>
      ) : null}
    </AppShell>
  );
}
