"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ActionFormLayout } from "@/components/shared/ActionFormLayout";
import {
  FormField,
  formControlClass,
  formTextareaClass,
} from "@/components/shared/form/FormField";
import {
  hasErrors,
  type FormErrors,
  type SupportFormValues,
  validateSupportForm,
} from "@/utils/actionFormValidation";
import { postJson } from "@/utils/apiClient";

const initialValues: SupportFormValues = {
  fullName: "",
  email: "",
  orderId: "",
  message: "",
};

export default function SupportPage() {
  const [values, setValues] = useState<SupportFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<SupportFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSupportForm(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      toast.error("Please fix the highlighted form errors.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postJson("/actions/support", values);
      toast.success("Ticket submitted. We will respond shortly.");
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit support ticket.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionFormLayout
      eyebrow="Support"
      title="Contact Support"
      description="Tell us what happened and our team will follow up quickly."
      backHref="/order-tracking"
      backLabel="Back to Order Tracking"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField
          htmlFor="fullName"
          label="Full Name"
          info="Include your first and last name so support can find your profile quickly."
          error={errors.fullName}
        >
          <input
            id="fullName"
            className={formControlClass}
            value={values.fullName}
            onChange={(event) => setValues((prev) => ({ ...prev, fullName: event.target.value }))}
          />
        </FormField>

        <FormField
          htmlFor="email"
          label="Email"
          info="We will reply to this email address."
          error={errors.email}
        >
          <input
            id="email"
            className={formControlClass}
            value={values.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          />
        </FormField>

        <FormField
          htmlFor="orderId"
          label="Order ID (Optional)"
          info="Format example: PL-8821"
          error={errors.orderId}
        >
          <input
            id="orderId"
            className={formControlClass}
            placeholder="PL-8821"
            value={values.orderId}
            onChange={(event) => setValues((prev) => ({ ...prev, orderId: event.target.value }))}
          />
        </FormField>

        <FormField
          htmlFor="message"
          label="Message"
          info="Share key details, including time and issue summary."
          error={errors.message}
        >
          <textarea
            id="message"
            className={formTextareaClass}
            value={values.message}
            onChange={(event) => setValues((prev) => ({ ...prev, message: event.target.value }))}
          />
        </FormField>

        <button
          className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </ActionFormLayout>
  );
}
