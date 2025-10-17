import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
        '*.cluster-ejd22kqny5htuv5dfowoyipt52.cloudworkstations.dev'
    ]
  },
   webpack: (config, { isServer }) => {
    // This is to make `firebase-admin` work with Next.js
    // The 'encoding' module is not essential for firebase-admin and can be ignored.
    if (isServer) {
        config.externals.push('encoding');
    }
    return config;
  },
};

export default nextConfig;
