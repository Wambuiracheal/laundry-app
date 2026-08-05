import { Suspense } from "react";
import { OrderTrackingScreen as MobileOrderTrackingScreen } from "@/components/mobile/screens/OrderTrackingScreen";
import { RequireAuth } from "@/components/shared/auth/RequireAuth";
import { OrderTrackingScreen as WebOrderTrackingScreen } from "@/components/web/screens/OrderTrackingScreen";

export default function OrderTrackingPage() {
  return (
    <RequireAuth>
      <div className="lg:hidden">
        <MobileOrderTrackingScreen />
      </div>
      <div className="hidden lg:block">
        <Suspense fallback={null}>
          <WebOrderTrackingScreen />
        </Suspense>
      </div>
    </RequireAuth>
  );
}
