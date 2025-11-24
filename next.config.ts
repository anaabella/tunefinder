
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: '6000-firebase-studio-1763760399471.cluster-xvr5pmatm5a4gx76fmat6kxt6o.cloudworkstations.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
   webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.ts$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/chunks/[name].[contenthash].js',
          publicPath: '/_next/',
        },
      });
    }
    // This is required for wasm modules to work correctly with webpack 5
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true, };
    return config;
  },
};

export default nextConfig;
