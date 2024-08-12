import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  server:{
    host: '0.0.0.0', // 配置项目可以局域网访问
    cors: true, // 默认启用并允许任何源
  },
  plugins: [react()],
})
