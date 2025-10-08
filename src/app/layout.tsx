import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'E-Ntemba',
  description: 'Vendor dashboard for E-Ntemba',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22> kiosk on slate background</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The theme class on <html> will be managed by client-side JavaScript
  // in the Settings page or a dedicated theme provider/hook in a more complex setup.
  // For now, we can keep the default dark class or remove it and let the client script handle it.
  // Keeping it 'dark' provides a default until client-side JS loads and potentially changes it.
  return (
    <html lang="en" className="dark">
       <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' role='img' aria-label='Green kiosk on slate background'%3E%3Crect width='64' height='64' rx='8' ry='8' fill='hsl(158, 64%_ 45%)' fill-opacity='0.2'/%3E%3Cg transform='translate(4,4) scale(0.875)'%3E%3Cg opacity='0.12' transform='translate(0,2)'%3E%3Crect x='6' y='30' width='52' height='22' rx='3' fill='%23000'/%3E%3C/g%3E%3Cg transform='translate(6,6)'%3E%3Crect x='6' y='26' width='44' height='18' rx='3' fill='%232E8B57'/%3E%3Crect x='10' y='30' width='36' height='10' rx='2' fill='%231E6B42'/%3E%3Crect x='12' y='19' width='12' height='12' rx='1.5' fill='%23FFFFFF' opacity='0.9'/%3E%3Crect x='29' y='19' width='11' height='12' rx='1.5' fill='%230B3F2E' opacity='0.12'/%3E%3Cg transform='translate(0,0)'%3E%3Crect x='4' y='6' width='48' height='14' rx='3' fill='%231E6B42'/%3E%3Cpath d='M6 8 h8 a0 0 0 0 1 0 0 v8 h-8 z' fill='%232ECC71'/%3E%3Cpath d='M18 8 h8 v8 h-8 z' fill='%232ECC71'/%3E%3Cpath d='M30 8 h8 v8 h-8 z' fill='%232ECC71'/%3E%3Cpath d='M42 8 h6 v8 h-6 z' fill='%232ECC71'/%3E%3Crect x='4' y='18' width='48' height='3' rx='1.5' fill='%23164C34'/%3E%3C/g%3E%3Crect x='2' y='2' width='52' height='6' rx='3' fill='%23144C33'/%3E%3Crect x='13' y='21.5' width='6' height='2' rx='0.8' fill='%23E6F6EA'/%3E%3Crect x='32' y='21.5' width='5' height='2' rx='0.8' fill='%23BEE9D0' opacity='0.7'/%3E%3Crect x='6' y='26' width='44' height='18' rx='3' fill='none' stroke='%23163D2D' stroke-width='0.8'/%3E%3Crect x='4' y='6' width='48' height='14' rx='3' fill='none' stroke='%230F2B20' stroke-width='0.8'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"
          type="image/svg+xml"
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
