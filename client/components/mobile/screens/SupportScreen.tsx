"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { navForRole, homeHrefForNav } from "@/components/mobile/nav";
import { AppShell, PageHeading, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { displayName } from "@/components/mobile/SessionUser";
import { FormField, FormStatusMessage, formControlClass, formTextareaClass } from "@/components/shared/form/FormField";
import { useSession } from "@/hooks/useSession";
import { hasErrors, validateSupportForm, type FormErrors, type SupportFormValues } from "@/utils/actionFormValidation";
import { postJson } from "@/utils/apiClient";

export function SupportScreen() {
  const session = useSession();
  const orderParam = useSearchParams().get("order") ?? "";
  const nav = navForRole(session?.role);
  // Untouched fields fall back to the signed-in account, so customers rarely retype them.
  const [edits, setEdits] = useState<Partial<SupportFormValues>>({});
  const values: SupportFormValues = {
    fullName: edits.fullName ?? displayName(session),
    email: edits.email ?? session?.email ?? "",
    orderId: edits.orderId ?? orderParam.replace(/^#/, ""),
    message: edits.message ?? "",
  };
  const [errors, setErrors] = useState<FormErrors<SupportFormValues>>({});
  const [status, setStatus] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(field: keyof SupportFormValues, value: string) {
    setEdits((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSupportForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setStatus(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      await postJson("/api/actions/support", values);
      setStatus({ text: "Ticket submitted. We'll reply by email shortly.", tone: "success" });
      setEdits({ message: "" });
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Failed to submit support ticket.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell active="support" nav={nav} homeHref={nav === "customer" ? undefined : homeHrefForNav(nav)} title="Help & support">
      <PageHeading title="Help & support" subtitle="Tell us what happened and our team will follow up quickly." />
      <SoftCard padding="p-5" className="max-w-xl">
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor="fullName" label="Full name" error={errors.fullName}>
              <input id="fullName" className={formControlClass} value={values.fullName} onChange={(event) => setField("fullName", event.target.value)} />
            </FormField>
            <FormField htmlFor="email" label="Email" info="We'll reply to this address." error={errors.email}>
              <input id="email" type="email" className={formControlClass} value={values.email} onChange={(event) => setField("email", event.target.value)} />
            </FormField>
          </div>

          <FormField htmlFor="orderId" label="Order (optional)" info="Shown on your order page, e.g. PL-3F2A9C" error={errors.orderId}>
            <input
              id="orderId"
              className={formControlClass}
              placeholder="PL-3F2A9C"
              value={values.orderId}
              onChange={(event) => setField("orderId", event.target.value)}
            />
          </FormField>

          <FormField htmlFor="message" label="Message" error={errors.message}>
            <textarea id="message" className={formTextareaClass} value={values.message} onChange={(event) => setField("message", event.target.value)} />
          </FormField>

          <button className={`${primaryButtonClass} w-full`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Send to support"}
          </button>
          {status ? <FormStatusMessage message={status.text} tone={status.tone} /> : null}
        </form>
      </SoftCard>
    </AppShell>
  );
}
