"use client";

import { useState } from "react";
import { ActionFormLayout } from "@/components/shared/ActionFormLayout";
import {
  FormField,
  FormStatusMessage,
  formSelectClass,
  formTextareaClass,
} from "@/components/shared/form/FormField";
import {
  hasErrors,
  type CancellationValues,
  type FormErrors,
  validateCancellationForm,
} from "@/utils/actionFormValidation";
import { postJson } from "@/utils/apiClient";

type CancellationFormProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  successMessage: string;
  endpoint: "/api/actions/cancel-pickup" | "/api/actions/cancel-order";
};

const initialValues: CancellationValues = {
  reason: "",
  details: "",
  acknowledge: false,
};

const reasons = ["Schedule conflict", "No longer needed", "Pricing concern", "Other"];

export function CancellationForm({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  successMessage,
  endpoint,
}: CancellationFormProps) {
  const [values, setValues] = useState<CancellationValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<CancellationValues>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCancellationForm(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      setStatus(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      await postJson(endpoint, values);
      setStatus(successMessage);
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit request.";
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionFormLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      backHref={backHref}
      backLabel={backLabel}
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField
          htmlFor="reason"
          label="Reason"
          info="Choose the main reason for this cancellation."
          error={errors.reason}
        >
          <select
            id="reason"
            className={formSelectClass}
            value={values.reason}
            onChange={(event) => setValues((prev) => ({ ...prev, reason: event.target.value }))}
          >
            <option value="">Select a reason</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          htmlFor="details"
          label="Details"
          info="Share context so we can improve future pickups and orders."
          error={errors.details}
        >
          <textarea
            id="details"
            className={formTextareaClass}
            placeholder="Tell us what happened"
            value={values.details}
            onChange={(event) => setValues((prev) => ({ ...prev, details: event.target.value }))}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.acknowledge}
            onChange={(event) => setValues((prev) => ({ ...prev, acknowledge: event.target.checked }))}
          />
          I understand this action may not be reversible.
        </label>
        {errors.acknowledge ? <p className="text-xs text-rose-600">{errors.acknowledge}</p> : null}

        <button
          className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>

        {status ? <FormStatusMessage message={status} /> : null}
      </form>
    </ActionFormLayout>
  );
}
