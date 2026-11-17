import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A biblioteca de PDF roda só no servidor e não deve ser empacotada.
  serverExternalPackages: ["@react-pdf/renderer"],
  poweredByHeader: false,
};

export default nextConfig;
