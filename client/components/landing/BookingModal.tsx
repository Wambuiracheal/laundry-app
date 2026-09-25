"use client";

import { useMemo, useState } from "react";
import {
  hasBookingErrors,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormValues,
} from "@/utils/bookingValidation";
import { formControlClass, submitButtonClass } from "@/components/shared/form/FormField";

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  onBooked: (name: string) => void;
};

const initialValues: BookingFormValues = {
  fullName: "",
  phone: "",
  location: "",
  service: "",
  pickupDate: "",
};

export function BookingModal({ open, onClose, onBooked }: BookingModalProps) {
  const [values, setValues] = useState<BookingFormValues>(initialValues);
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const minDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  if (!open) {
    return null;
  }

  function handleInputChange(field: keyof BookingFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const validationErrors = validateBookingForm(values);
    setErrors(validationErrors);

    if (hasBookingErrors(validationErrors)) {
      return;
    }

    onBooked(values.fullName.trim());
    setValues(initialValues);
    setSubmitted(false);
    setErrors({});
    onClose();
  }

  function renderError(field: keyof BookingFormValues) {
    if (!submitted || !errors[field]) {
      return null;
    }

    return <p className="mt-1 text-xs font-medium text-rose-600">{errors[field]}</p>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="booking-title" className="text-lg font-semibold text-slate-900">Book a pickup</h2>
            <p className="text-xs text-slate-500">We&apos;ll confirm your slot by SMS.</p>
          </div>
          <button
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            type="button"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              className={formControlClass}
              value={values.fullName}
              onChange={(event) => handleInputChange("fullName", event.target.value)}
              placeholder="Jane Wanjiru"
            />
            {renderError("fullName")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              className={formControlClass}
              value={values.phone}
              onChange={(event) => handleInputChange("phone", event.target.value)}
              placeholder="+2547XXXXXXXX"
            />
            {renderError("phone")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="location">
              Pickup Location
            </label>
            <input
              id="location"
              className={formControlClass}
              value={values.location}
              onChange={(event) => handleInputChange("location", event.target.value)}
              placeholder="Apartment, estate, or street"
            />
            {renderError("location")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="service">
                Service
              </label>
              <select
                id="service"
                className={formControlClass}
                value={values.service}
                onChange={(event) => handleInputChange("service", event.target.value)}
              >
                <option value="">Select...</option>
                <option value="wash-fold">Wash & Fold</option>
                <option value="dry-cleaning">Dry Cleaning</option>
              </select>
              {renderError("service")}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="pickupDate">
                Pickup Date
              </label>
              <input
                id="pickupDate"
                type="date"
                min={minDate}
                className={formControlClass}
                value={values.pickupDate}
                onChange={(event) => handleInputChange("pickupDate", event.target.value)}
              />
              {renderError("pickupDate")}
            </div>
          </div>

          <button
            className={`${submitButtonClass} mt-2`}
            type="submit"
          >
            Confirm Pickup
          </button>
        </form>
      </div>
    </div>
  );
}
