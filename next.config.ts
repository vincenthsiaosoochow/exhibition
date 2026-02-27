import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  async rewrites() {
    let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    // Zeabur dashboard 注入的环境变量字符串如果未被转译，在 JS 中替换它们
    if (backendUrl.includes('${EXHIBITION_HOST}')) {
      backendUrl = backendUrl.replace('${EXHIBITION_HOST}', process.env.EXHIBITION_HOST || 'localhost');
    }
    if (backendUrl.includes('${EXHIBITION_PORT}')) {
      backendUrl = backendUrl.replace('${EXHIBITION_PORT}', process.env.EXHIBITION_PORT || '8000');
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
