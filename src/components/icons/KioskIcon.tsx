// src/components/icons/KioskIcon.tsx

import * as React from "react";

export const KioskIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Green kiosk on slate background"
      {...props}
    >
      <rect width="64" height="64" rx="8" ry="8" fill="hsl(var(--primary))" fillOpacity="0.2" />
      <g transform="translate(4,4) scale(0.875)">
        <g opacity="0.12" transform="translate(0,2)">
          <rect x="6" y="30" width="52" height="22" rx="3" fill="#000" />
        </g>
        <g transform="translate(6,6)">
          <rect x="6" y="26" width="44" height="18" rx="3" fill="#2E8B57" />
          <rect x="10" y="30" width="36" height="10" rx="2" fill="#1E6B42" />
          <rect x="12" y="19" width="12" height="12" rx="1.5" fill="#FFFFFF" opacity="0.9" />
          <rect x="29" y="19" width="11" height="12" rx="1.5" fill="#0B3F2E" opacity="0.12" />
          <g transform="translate(0,0)">
            <rect x="4" y="6" width="48" height="14" rx="3" fill="#1E6B42" />
            <path d="M6 8 h8 a0 0 0 0 1 0 0 v8 h-8 z" fill="#2ECC71" />
            <path d="M18 8 h8 v8 h-8 z" fill="#2ECC71" />
            <path d="M30 8 h8 v8 h-8 z" fill="#2ECC71" />
            <path d="M42 8 h6 v8 h-6 z" fill="#2ECC71" />
            <rect x="4" y="18" width="48" height="3" rx="1.5" fill="#164C34" />
          </g>
          <rect x="2" y="2" width="52" height="6" rx="3" fill="#144C33" />
          <rect x="13" y="21.5" width="6" height="2" rx="0.8" fill="#E6F6EA" />
          <rect x="32" y="21.5" width="5" height="2" rx="0.8" fill="#BEE9D0" opacity="0.7" />
          <rect x="6" y="26" width="44" height="18" rx="3" fill="none" stroke="#163D2D" strokeWidth="0.8" />
          <rect x="4" y="6" width="48" height="14" rx="3" fill="none" stroke="#0F2B20" strokeWidth="0.8" />
        </g>
      </g>
    </svg>
  );
KioskIcon.displayName = "KioskIcon";