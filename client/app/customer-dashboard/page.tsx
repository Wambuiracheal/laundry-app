import { CustomerDashboardScreen } from "@/components/mobile/screens/CustomerDashboardScreen";
import { RequireAuth } from "@/components/shared/auth/RequireAuth";
import { DashboardScreen } from "@/components/web/screens/DashboardScreen";

export default function CustomerDashboardPage() {
  return (
    <RequireAuth>
      <div className="lg:hidden">
        <CustomerDashboardScreen />
      </div>
      <div className="hidden lg:block">
        <DashboardScreen />
      </div>
    </RequireAuth>
  );
}
