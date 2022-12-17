/** @type {import('next').NextConfig} */

const nextTranslate = require("next-translate")

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compress: false,
  ...nextTranslate(),
}

// const a = nextTranslate({
//   webpack: (config, { isServer, webpack }) => {
//     return config;
//   }})
module.exports = nextConfig
