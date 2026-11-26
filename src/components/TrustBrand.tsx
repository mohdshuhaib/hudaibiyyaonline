import React from "react";

export function TrustLogo({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hudaibiyya Islamic Charitable Trust Logo"
    >
      <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="4" />
      <circle cx="60" cy="60" r="48" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Crescent & Dome Emblem */}
      <path
        d="M60 22C46 22 36 33 36 46C36 53 39 59 44 63H76C81 59 84 53 84 46C84 33 74 22 60 22Z"
        fill="#1E40AF"
      />
      <path
        d="M60 27C51 27 44 35 44 45C44 50 46 55 50 58H70C74 55 76 50 76 45C76 35 69 27 60 27Z"
        fill="#3B82F6"
      />
      {/* Crescent */}
      <path
        d="M63 32C57.5 32 53 36.5 53 42C53 47.5 57.5 52 63 52C65.8 52 68.3 50.8 70.1 48.9C68.9 49.5 67.5 49.8 66 49.8C60.9 49.8 56.8 45.7 56.8 40.6C56.8 36.6 59.3 33.2 62.9 32H63Z"
        fill="#FFFFFF"
      />
      {/* Open Book / Base */}
      <path
        d="M32 69C41 65 51 66 60 72C69 66 79 65 88 69V82C79 78 69 79 60 85C51 79 41 78 32 82V69Z"
        fill="#1E3A8A"
      />
      <path
        d="M36 71.5C43 68.5 51.5 69.5 60 74.5C68.5 69.5 77 68.5 84 71.5V79C77 76 68.5 77 60 82C51.5 77 43 76 36 79V71.5Z"
        fill="#FFFFFF"
      />
      <text
        x="60"
        y="99"
        textAnchor="middle"
        fill="#1E3A8A"
        fontSize="9.5"
        fontWeight="700"
        letterSpacing="1.2"
      >
        HUDAIBIYYA
      </text>
    </svg>
  );
}

export function TrustSeal({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Official Trust Seal"
    >
      <circle cx="50" cy="50" r="45" stroke="#1D4ED8" strokeWidth="2.5" strokeDasharray="4 2" opacity="0.85" />
      <circle cx="50" cy="50" r="37" stroke="#1D4ED8" strokeWidth="1.2" opacity="0.85" />
      <text x="50" y="34" textAnchor="middle" fill="#1D4ED8" fontSize="7.5" fontWeight="700" letterSpacing="0.8">
        HUDAIBIYYA
      </text>
      <text x="50" y="52" textAnchor="middle" fill="#1D4ED8" fontSize="8" fontWeight="800">
        ISLAMIC TRUST
      </text>
      <text x="50" y="68" textAnchor="middle" fill="#1D4ED8" fontSize="6.5" fontWeight="600" letterSpacing="0.6">
        OFFICIAL SEAL
      </text>
    </svg>
  );
}

export function SignatureMark({
  variant = "president",
  className = "w-14 h-6",
}: {
  variant?: "president" | "secretary";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {variant === "president" ? (
        <path
          d="M10 28 C22 10, 32 10, 36 26 C40 34, 52 14, 62 22 C70 28, 86 12, 108 18"
          stroke="#0F172A"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M12 24 C24 34, 34 8, 46 22 C56 32, 68 12, 82 22 C92 28, 102 18, 112 20"
          stroke="#0F172A"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
