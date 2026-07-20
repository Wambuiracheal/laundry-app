import { CancellationForm } from "@/components/shared/CancellationForm";

export default function CancelPickupPage() {
  return (
    <CancellationForm
      eyebrow="Pickup"
      title="Cancel Pickup"
      description="Tell us why you need to cancel this pickup."
      backHref="/dark-dashboard"
      backLabel="Back to Dark Dashboard"
      successMessage="Pickup cancellation request received."
      endpoint="/actions/cancel-pickup"
    />
  );
}
