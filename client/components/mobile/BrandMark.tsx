import Image from "next/image";
import Logo from "@/public/mobile/logo.png";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src={Logo} alt="Panda Laundry" className={className} />;
}
