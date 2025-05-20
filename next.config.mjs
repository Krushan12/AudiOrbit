/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: `
            connect-src 'self' https://*.spotify.com https://*.google-analytics.com https://*.ingest.sentry.io/ https://*.googletagmanager.com https://*.google.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com ws: wss:;
            script-src 'self' https://*.google.com https://*.gstatic.com 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com;
            frame-src 'self' https://*.google.com https://*.firebaseio.com https://*.firebasedatabase.app;
            style-src 'self' 'unsafe-inline' https://*.google.com;
            img-src 'self' https://*.google.com;
            default-src 'self'
          `.replace(/\s+/g, ' ').trim()
        }
      ]
    }
  ]
};

export default nextConfig;
