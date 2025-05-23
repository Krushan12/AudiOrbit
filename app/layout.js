// app/layout.js
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';

export const metadata = {
  title: 'AudiOrbit',
  description: 'Your personal music journey',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}