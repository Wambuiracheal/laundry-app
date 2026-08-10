import { AuthLayout } from "@/components/shared/auth/AuthLayout";
import { RegisterScreen } from "@/components/mobile/screens/RegisterScreen";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterScreen />
    </AuthLayout>
  );
}
