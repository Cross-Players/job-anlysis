/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Toàn bộ số liệu đang tính ở trình duyệt nên build ra HTML/JS tĩnh (thư mục out/),
  // phục vụ bằng nginx, không cần chạy server Node. Xem Dockerfile và deploy/.
  output: 'export',
  poweredByHeader: false,
};
export default nextConfig;
