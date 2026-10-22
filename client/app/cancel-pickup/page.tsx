import { Suspense } from "react";
import { CancelOrderScreen } from "@/components/mobile/screens/CancelOrderScreen";

export default function Page() {
  // The screen reads `?id=` via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <CancelOrderScreen />
    </Suspense>
  );
}
