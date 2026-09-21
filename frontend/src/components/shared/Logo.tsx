import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
}

export default function Logo({ size = 32, showText = true, href = "/" }: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image
        src="/arixLOGO.png"
        alt="ARIX"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="text-xl font-bold text-[#1D1D1F]">ARIX</span>
      )}
    </Link>
  );
}