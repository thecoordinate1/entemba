import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

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
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
