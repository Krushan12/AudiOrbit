/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For development HTTPS, we'll use the environment variables approach
  // since the https option is not directly supported in Next.js 15.1.3
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
