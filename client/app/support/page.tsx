import { Suspense } from "react";
import { SupportScreen } from "@/components/mobile/screens/SupportScreen";

export default function SupportPage() {
  // The screen reads `?order=` via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <SupportScreen />
    </Suspense>
  );
}
