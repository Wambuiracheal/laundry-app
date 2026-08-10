import Image from "next/image";
import type { ReactNode } from "react";
import logo from "@/public/mobile/logo.png";
import loginArt from "@/public/web-app/login.jpg";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <div className="hidden w-1/2 shrink-0 flex-col justify-center bg-white px-16 md:flex">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2 self-start">
            <Image src={logo} alt="Panda Laundry" className="h-7 w-7 rounded-full" />
            <span className="text-base font-semibold text-blue-800">Panda Laundry</span>
          </div>

          <Image src={loginArt} alt="" priority className="w-full max-w-[220px]" />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Fresh laundry, delivered to your door.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Schedule pickups, track orders, and manage your laundry in one place —
            fast, reliable, and hassle-free.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto">{children}</div>
    </div>
  );
}
