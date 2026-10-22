import { Suspense } from "react";
import { RescheduleScreen } from "@/components/mobile/screens/RescheduleScreen";

export default function Page() {
  // The screen reads `?id=` via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <RescheduleScreen />
    </Suspense>
  );
}
