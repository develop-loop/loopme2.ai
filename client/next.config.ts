import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // 开发环境：代理到后端API
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    },
  }),
  
  // 生产环境：静态导出
  ...(!isDev && {
    output: 'export',
    trailingSlash: true,
    distDir: '../dist/client',
    assetPrefix: '',
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
