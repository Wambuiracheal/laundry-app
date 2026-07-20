import { CancellationForm } from "@/components/shared/CancellationForm";

export default function CancelOrderPage() {
  return (
    <CancellationForm
      eyebrow="Order"
      title="Cancel Order"
      description="Share your cancellation reason so we can improve your experience."
      backHref="/order-tracking"
      backLabel="Back to Order Tracking"
      successMessage="Order cancellation request submitted."
      endpoint="/actions/cancel-order"
    />
  );
}
