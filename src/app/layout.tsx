
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'E-Ntemba',
  description: 'Vendor dashboard for E-Ntemba',
  manifest: '/manifest.json',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22 role=%22img%22 aria-label=%22Green kiosk on slate background%22><rect width=%2264%22 height=%2264%22 rx=%228%22 ry=%228%22 fill=%22%232F4F4F%22/><g opacity=%220.12%22 transform=%22translate(0,2)%22><rect x=%226%22 y=%2230%22 width=%2252%22 height=%2222%22 rx=%223%22 fill=%22%23000%22/></g><g transform=%22translate(6,6)%22><rect x=%226%22 y=%2226%22 width=%2244%22 height=%2218%22 rx=%223%22 fill=%22%232E8B57%22/><rect x=%2210%22 y=%2230%22 width=%2236%22 height=%2210%22 rx=%222%22 fill=%22%231E6B42%22/><rect x=%2212%22 y=%2219%22 width=%2212%22 height=%2212%22 rx=%221.5%22 fill=%22%23FFFFFF%22 opacity=%220.9%22/><rect x=%2229%22 y=%2219%22 width=%2211%22 height=%2212%22 rx=%221.5%22 fill=%22%230B3F2E%22 opacity=%220.12%22/><g transform=%22translate(0,0)%22><rect x=%224%22 y=%226%22 width=%2248%22 height=%2214%22 rx=%223%22 fill=%22%231E6B42%22/><path d=%22M6 8 h8 a0 0 0 0 1 0 0 v8 h-8 z%22 fill=%22%232ECC71%22/><path d=%22M18 8 h8 v8 h-8 z%22 fill=%22%232ECC71%22/><path d=%22M30 8 h8 v8 h-8 z%22 fill=%22%232ECC71%22/><path d=%22M42 8 h6 v8 h-6 z%22 fill=%22%232ECC71%22/><rect x=%224%22 y=%2218%22 width=%2248%22 height=%223%22 rx=%221.5%22 fill=%22%23164C34%22/></g><rect x=%222%22 y=%222%22 width=%2252%22 height=%226%22 rx=%223%22 fill=%22%23144C33%22/><rect x=%2213%22 y=%2221.5%22 width=%226%22 height=%222%22 rx=%220.8%22 fill=%22%23E6F6EA%22/><rect x=%2232%22 y=%2221.5%22 width=%225%22 height=%222%22 rx=%220.8%22 fill=%22%23BEE9D0%22 opacity=%220.7%22/><rect x=%226%22 y=%2226%22 width=%2244%22 height=%2218%22 rx=%223%22 fill=%22none%22 stroke=%22%23163D2D%22 stroke-width=%220.8%22/><rect x=%224%22 y=%226%22 width=%2248%22 height=%2214%22 rx=%223%22 fill=%22none%22 stroke=%22%230F2B20%22 stroke-width=%220.8%22/></g></svg>',
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
        {/* The favicon is now handled by the Next.js Metadata API above */}
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
