import { authRequest } from "@/utils/apiClient";

export type PaymentStatus = "pending" | "success" | "failed";

export type MpesaPayment = {
  id: string;
  order_id: string;
  /** Decimal serialised as a string. */
  amount: string;
  status: PaymentStatus;
  phone: string | null;
  /** M-Pesa confirmation code; only known when Daraja can reach the callback URL. */
  mpesa_receipt: string | null;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  updated_at: string;
  order?: { id: string; total_amount: string | null; remaining_amount: string | null; payment_status: string; customer?: string };
};

/** How often the payment card checks on an open M-Pesa prompt. */
export const PAYMENT_POLL_INTERVAL_MS = 4000;
/** Stop checking after this long; Daraja gives up on an unanswered prompt well before. */
export const PAYMENT_POLL_TIMEOUT_MS = 3 * 60 * 1000;

export function startMpesaPayment(orderId: string, phone: string) {
  return authRequest<MpesaPayment>("/api/payments/mpesa/stk", { method: "POST", body: { order_id: orderId, phone } });
}

export function fetchPayment(paymentId: string) {
  return authRequest<MpesaPayment>(`/api/payments/mpesa/${paymentId}`);
}

export function fetchPaymentLog(status?: PaymentStatus) {
  return authRequest<MpesaPayment[]>(`/api/payments/mpesa${status ? `?status=${status}` : ""}`);
}

/** Plain-language reason for a failed STK push, from Daraja's result code. */
export function paymentFailureMessage(payment: Pick<MpesaPayment, "result_code" | "result_desc">) {
  switch (payment.result_code) {
    case "1032":
      return "The M-Pesa prompt was cancelled.";
    case "1037":
      return "The M-Pesa prompt timed out before a PIN was entered. Make sure your phone is on and try again.";
    case "2001":
      return "The M-Pesa PIN was wrong.";
    case "1":
      return "There isn't enough money in the M-Pesa account.";
    case "timeout":
      return "We didn't get a confirmation from M-Pesa in time.";
    default:
      return payment.result_desc || "The payment didn't go through.";
  }
}
