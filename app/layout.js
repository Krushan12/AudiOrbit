'use client';

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {children}
      </body>
    </html>
  );
}
