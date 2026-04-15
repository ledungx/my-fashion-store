/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './utils/cdnLoader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow EVERYTHING securely globally for affiliates
      },
      {
        protocol: 'http',
        hostname: '**', // Ensure fallback HTTP paths just in case older CSV rows exist
      }
    ],
  },
};

export default nextConfig;
