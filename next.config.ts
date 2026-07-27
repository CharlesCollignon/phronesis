import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.assemblee-nationale.fr",
        pathname: "/dyn/static/tribun/**",
      },
      {
        protocol: "https",
        hostname: "www.senat.fr",
        pathname: "/senimg/**",
      },
    ],
  },
};

export default nextConfig;
