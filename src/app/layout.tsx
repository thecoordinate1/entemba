import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed as it causes module not found error
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans;
// const geistMono = GeistMono; // Removed as it causes module not found error

export const metadata: Metadata = {
  title: 'E-Ntemba',
  description: 'Vendor dashboard for E-Ntemba',
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
      <body className={`${geistSans.variable} font-sans antialiased`}> {/* Removed geistMono.variable */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
