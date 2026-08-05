import { NewOrderScreen } from "@/components/mobile/screens/NewOrderScreen";
import { ServicesScreen } from "@/components/web/screens/ServicesScreen";

export default function NewOrderPage() {
  return (
    <>
      <div className="lg:hidden">
        <NewOrderScreen />
      </div>
      <div className="hidden lg:block">
        <ServicesScreen />
      </div>
    </>
  );
}
