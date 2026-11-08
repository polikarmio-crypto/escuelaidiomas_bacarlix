const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*'
      },
      {
        source: '/api/quarkus/:path*',
        destination: 'http://localhost:8081/api/:path*'
      }
    ];
  }
};

export default nextConfig;
