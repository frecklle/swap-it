/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"], // allow Unsplash image host
  },
};

module.exports = nextConfig;
