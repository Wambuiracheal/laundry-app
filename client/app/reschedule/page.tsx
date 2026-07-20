"use client";

import { useMemo, useState } from "react";
import { ActionFormLayout } from "@/components/shared/ActionFormLayout";
import {
  FormField,
  formControlClass,
  formSelectClass,
  formTextareaClass,
} from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
  hasErrors,
  type FormErrors,
  type RescheduleValues,
  validateRescheduleForm,
} from "@/utils/actionFormValidation";
import { postJson } from "@/utils/apiClient";

const initialValues: RescheduleValues = {
  pickupDate: "",
  timeWindow: "",
  note: "",
};

const windows = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "02:00 PM - 04:00 PM"];

export default function ReschedulePage() {
  const [values, setValues] = useState<RescheduleValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<RescheduleValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const minDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRescheduleForm(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      toast.error("Please fix the highlighted form errors.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postJson("/actions/reschedule", values);
      toast.success("Pickup rescheduled successfully.");
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reschedule pickup.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionFormLayout
      eyebrow="Pickup"
      title="Reschedule Pickup"
      description="Choose a new date and preferred delivery window."
      backHref="/dark-dashboard"
      backLabel="Back to Dark Dashboard"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField
          htmlFor="pickupDate"
          label="New Pickup Date"
          info="Choose a date from today onward."
          error={errors.pickupDate}
        >
          <input
            id="pickupDate"
            type="date"
            min={minDate}
            className={formControlClass}
            value={values.pickupDate}
            onChange={(event) => setValues((prev) => ({ ...prev, pickupDate: event.target.value }))}
          />
        </FormField>

        <FormField
          htmlFor="timeWindow"
          label="Time Window"
          info="Pick a slot when someone can receive the pickup."
          error={errors.timeWindow}
        >
          <select
            id="timeWindow"
            className={formSelectClass}
            value={values.timeWindow}
            onChange={(event) => setValues((prev) => ({ ...prev, timeWindow: event.target.value }))}
          >
            <option value="">Select window</option>
            {windows.map((windowValue) => (
              <option key={windowValue} value={windowValue}>
                {windowValue}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          htmlFor="note"
          label="Note (Optional)"
          info="Add gate code, landmarks, or special instructions."
          error={errors.note}
        >
          <textarea
            id="note"
            className={formTextareaClass}
            value={values.note}
            onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
          />
        </FormField>

        <button
          className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </ActionFormLayout>
  );
}
