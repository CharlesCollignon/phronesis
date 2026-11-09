import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Titre, description et données structurées dans le <head> initial
  // pour tous les visiteurs, pas seulement la courte liste de robots
  // reconnus par Next : les robots des moteurs IA (GPTBot, ClaudeBot,
  // PerplexityBot), Qwant ou les aperçus de liens n'exécutent pas le
  // JavaScript. Les pages lisent les mêmes requêtes en cache, le coût
  // est négligeable.
  htmlLimitedBots: /.*/,
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
