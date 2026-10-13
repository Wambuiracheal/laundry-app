import { Suspense } from "react";
import { OrderTrackingScreen } from "@/components/mobile/screens/OrderTrackingScreen";

export default function OrderTrackingPage() {
  // The screen reads `?id=` via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <OrderTrackingScreen />
    </Suspense>
  );
}
