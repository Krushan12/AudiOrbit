// app/layout.js
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';

export const metadata = {
  title: 'AudiOrbit',
  description: 'Premium Car Dealership Platform',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}