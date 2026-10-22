"use client";

import { useEffect, useState } from "react";
import { PhoneIcon } from "@/components/mobile/icons";
import { SoftCard, secondaryButtonClass } from "@/components/mobile/primitives";
import { FormField, FormStatusMessage, formControlClass } from "@/components/shared/form/FormField";
import { fetchSmsPreferences, updateSmsPreferences, type SmsPreferences } from "@/utils/notificationsApi";

/** Customers choose whether order updates are texted to them, and to which number. */
export function SmsPreferencesCard() {
  const [prefs, setPrefs] = useState<SmsPreferences | null>(null);
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSmsPreferences().then(setPrefs, (error: unknown) =>
      setStatus({ text: error instanceof Error ? error.message : "Couldn't load SMS settings.", tone: "error" }),
    );
  }, []);

  async function save(changes: Parameters<typeof updateSmsPreferences>[0], success: string) {
    try {
      setSaving(true);
      setStatus(null);
      setPrefs(await updateSmsPreferences(changes));
      setEditingPhone(false);
      setStatus({ text: success, tone: "success" });
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Couldn't save. Please try again.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SoftCard padding="p-5">
      <section id="sms" aria-labelledby="sms-heading" className="scroll-mt-20">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <PhoneIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="sms-heading" className="text-sm font-semibold">
              SMS updates
            </h2>
            <p className="text-xs text-slate-500">Get a text when your pickup is booked, collected, priced, ready and delivered.</p>
          </div>
          {prefs ? (
            <button
              type="button"
              role="switch"
              aria-checked={prefs.sms_opt_in}
              aria-label="Text me order updates"
              disabled={saving}
              onClick={() => save({ sms_opt_in: !prefs.sms_opt_in }, prefs.sms_opt_in ? "SMS updates turned off." : "SMS updates turned on.")}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
                prefs.sms_opt_in ? "bg-blue-700" : "bg-slate-300"
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${prefs.sms_opt_in ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          ) : null}
        </div>

        {prefs ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {editingPhone ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save({ phone }, "Phone number updated.");
                }}
              >
                <FormField htmlFor="smsPhone" label="Mobile number" info="Kenyan mobile, e.g. 0712 345 678">
                  <input
                    id="smsPhone"
                    type="tel"
                    autoComplete="tel"
                    className={formControlClass}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </FormField>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="inline-flex items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                    {saving ? "Saving…" : "Save number"}
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setEditingPhone(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Texts go to</p>
                  <p className="truncate text-sm font-medium">{prefs.phone}</p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => {
                    setPhone(prefs.phone);
                    setEditingPhone(true);
                    setStatus(null);
                  }}
                >
                  Change
                </button>
              </div>
            )}

            {prefs.sms_opt_in && !prefs.phone_valid ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                We can&apos;t text this number. Add a Kenyan mobile number to get SMS updates.
              </p>
            ) : null}
            {prefs.sms_opt_in && prefs.phone_valid && !prefs.sms_available ? (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Texting isn&apos;t switched on for the shop yet. Your updates still appear under Updates.
              </p>
            ) : null}
          </div>
        ) : null}

        {status ? (
          <div className="mt-3">
            <FormStatusMessage message={status.text} tone={status.tone} />
          </div>
        ) : null}
      </section>
    </SoftCard>
  );
}
