import React from "react";
import bkashImg from "@/assets/bkash.webp";
import nagadImg from "@/assets/nagad.webp";
import rocketImg from "@/assets/rocket.webp";

interface PaymentLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({
  name,
  logoUrl,
  className = "",
  size = "md",
}) => {
  const cleanName = (name || "").toLowerCase().trim();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  // 1. bKash exact user uploaded logo
  if (cleanName.includes("bkash") || cleanName.includes("বিকাশ")) {
    return (
      <img
        src={bkashImg}
        alt="bKash"
        className={`${sizeClasses} object-cover rounded-xl shadow-xs shrink-0 select-none ${className}`}
      />
    );
  }

  // 2. Nagad exact user uploaded logo
  if (cleanName.includes("nagad") || cleanName.includes("নগদ")) {
    return (
      <img
        src={nagadImg}
        alt="Nagad"
        className={`${sizeClasses} object-contain rounded-xl bg-white p-0.5 border border-border/50 shadow-xs shrink-0 select-none ${className}`}
      />
    );
  }

  // 3. Rocket exact user uploaded logo
  if (cleanName.includes("rocket") || cleanName.includes("রকেট") || cleanName.includes("dbbl")) {
    return (
      <img
        src={rocketImg}
        alt="Rocket"
        className={`${sizeClasses} object-cover rounded-xl shadow-xs shrink-0 select-none ${className}`}
      />
    );
  }

  // If there is an explicit custom uploaded image logo from database
  if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || logoUrl.startsWith("data:"))) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${sizeClasses} object-contain rounded-xl ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // 4. Upay Vector Logo
  if (cleanName.includes("upay") || cleanName.includes("উপায়")) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-[#005C8A] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
        title="Upay"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <text
            x="50"
            y="62"
            fill="#FFFFFF"
            fontSize="32"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            u
          </text>
          <circle cx="68" cy="32" r="7" fill="#FDD835" />
        </svg>
      </div>
    );
  }

  // 5. Binance / Crypto Vector Logo
  if (cleanName.includes("binance") || cleanName.includes("binnace") || cleanName.includes("crypto") || cleanName.includes("usdt")) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-[#181A20] flex items-center justify-center p-1.5 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
        title="Binance"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="#F3BA2F">
          <path d="M50 18 L62 30 L50 42 L38 30 Z" />
          <path d="M72 40 L84 52 L72 64 L60 52 Z" />
          <path d="M28 40 L40 52 L28 64 L16 52 Z" />
          <path d="M50 62 L62 74 L50 86 L38 74 Z" />
          <path d="M50 46 L58 54 L50 62 L42 54 Z" />
        </svg>
      </div>
    );
  }

  // 6. Bank Transfer
  if (cleanName.includes("bank") || cleanName.includes("ব্যাংক")) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center p-2 shadow-xs shrink-0 select-none text-white ${className}`}
        title="Bank Transfer"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3L2 10h20L12 3z" />
        </svg>
      </div>
    );
  }

  // Default fallback
  return (
    <div
      className={`${sizeClasses} rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground uppercase shrink-0 select-none ${className}`}
    >
      {cleanName.slice(0, 3)}
    </div>
  );
};
