import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false, // ✅ сохраняем оригинальный Host
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // ✅ самое важное: пробрасываем host (turko.localhost:8080)
            if (req.headers.host) proxyReq.setHeader("host", req.headers.host);
          });
        },
      },

      "/restaurant": {
        target: "http://localhost:8000",
        changeOrigin: false, // ✅ важно
        secure: false,
        rewrite: () => "/api/public/restaurant/",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader("host", req.headers.host);
          });
        },
      },

      "/menu": {
        target: "http://localhost:8000",
        changeOrigin: false, // ✅ важно
        secure: false,
        rewrite: () => "/api/public/menu/",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader("host", req.headers.host);
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
