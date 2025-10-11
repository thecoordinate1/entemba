
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'E-Ntemba',
  description: 'Vendor dashboard for E-Ntemba',
  manifest: '/manifest.json',
  icons: {
    icon: 'data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2764%27 height=%2764%27 viewBox=%270 0 64 64%27 role=%27img%27 aria-label=%27Green kiosk on slate background%27%3e%3crect width=%2764%27 height=%2764%27 rx=%278%27 ry=%278%27 fill=%27%232F4F4F%27/%3e%3cg opacity=%270.12%27 transform=%27translate(0,2)%27%3e%3crect x=%276%27 y=%2730%27 width=%2752%27 height=%2722%27 rx=%273%27 fill=%27%23000%27/%3e%3c/g%3e%3cg transform=%27translate(6,6)%27%3e%3crect x=%276%27 y=%2726%27 width=%2744%27 height=%2718%27 rx=%273%27 fill=%27%232E8B57%27/%3e%3crect x=%2710%27 y=%2730%27 width=%2736%27 height=%2710%27 rx=%272%27 fill=%27%231E6B42%27/%3e%3crect x=%2712%27 y=%2719%27 width=%2712%27 height=%2712%27 rx=%271.5%27 fill=%27%23FFFFFF%27 opacity=%270.9%27/%3e%3crect x=%2729%27 y=%2719%27 width=%2711%27 height=%2712%27 rx=%271.5%27 fill=%27%230B3F2E%27 opacity=%270.12%27/%3e%3cg transform=%27translate(0,0)%27%3e%3crect x=%274%27 y=%276%27 width=%2748%27 height=%2714%27 rx=%273%27 fill=%27%231E6B42%27/%3e%3cpath d=%27M6 8 h8 a0 0 0 0 1 0 0 v8 h-8 z%27 fill=%27%232ECC71%27/%3e%3cpath d=%27M18 8 h8 v8 h-8 z%27 fill=%27%232ECC71%27/%3e%3cpath d=%27M30 8 h8 v8 h-8 z%27 fill=%27%232ECC71%27/%3e%3cpath d=%27M42 8 h6 v8 h-6 z%27 fill=%27%232ECC71%27/%3e%3crect x=%274%27 y=%2718%27 width=%2748%27 height=%273%27 rx=%271.5%27 fill=%27%23164C34%27/%3e%3c/g%3e%3crect x=%272%27 y=%272%27 width=%2752%27 height=%276%27 rx=%273%27 fill=%27%23144C33%27/%3e%3crect x=%2713%27 y=%2721.5%27 width=%276%27 height=%272%27 rx=%270.8%27 fill=%27%23E6F6EA%27/%3e%3crect x=%2732%27 y=%2721.5%27 width=%275%27 height=%272%27 rx=%270.8%27 fill=%27%23BEE9D0%27 opacity=%270.7%27/%3e%3crect x=%276%27 y=%2726%27 width=%2744%27 height=%2718%27 rx=%273%27 fill=%27none%27 stroke=%27%23163D2D%27 stroke-width=%270.8%27/%3e%3crect x=%274%27 y=%276%27 width=%2748%27 height=%2714%27 rx=%273%27 fill=%27none%27 stroke=%27%230F2B20%27 stroke-width=%270.8%27/%3e%3c/g%3e%3c/svg%3e',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
       <head>
        <meta name="theme-color" content="#2E8B57" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
