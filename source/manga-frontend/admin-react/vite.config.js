import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
  ],
  server: {
    port: 3000, // Đổi port thành 3000
    open: true, // Tự động mở trình duyệt khi khởi động
    strictPort: true, // Báo lỗi nếu port đã được sử dụng thay vì tự động tìm port khác
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
