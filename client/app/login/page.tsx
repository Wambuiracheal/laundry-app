import { AuthLayout } from "@/components/shared/auth/AuthLayout";
import { LoginScreen } from "@/components/mobile/screens/LoginScreen";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginScreen />
    </AuthLayout>
  );
}
