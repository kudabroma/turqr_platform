import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },

    proxy: {
      // ✅ API всегда через /api
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false, // сохраняем Host (turko.localhost:8080)
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader("host", req.headers.host);
          });
        },
      },

      // ✅ MEDIA: чтобы <img src=".../media/..."> реально отдавал картинку из Django
      "/media": {
        target: "http://localhost:8000",
        changeOrigin: false,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader("host", req.headers.host);
          });
        },
      },

      // (опционально) если Django отдаёт статику
      "/static": {
        target: "http://localhost:8000",
        changeOrigin: false,
        secure: false,
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