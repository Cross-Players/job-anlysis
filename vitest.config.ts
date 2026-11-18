// Cấu hình Vitest (công cụ chạy test). Chỉ dùng khi phát triển, không vào bản build.
// Alias '@' trỏ về thư mục src, giống tsconfig, để test import được '@/lib/...'.
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Dịch JSX theo kiểu mới của React 17+ (không cần `import React` ở mỗi file)
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
  },
});
