/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'suafast.live'],
  },
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that may not be installed
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'aws-sdk': 'commonjs aws-sdk',
        '@vonage/server-sdk': 'commonjs @vonage/server-sdk',
      })
    }
    return config
  },
}

module.exports = nextConfig

