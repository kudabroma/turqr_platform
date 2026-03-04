import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Если открываешь сайт через ngrok, обычно host содержит ngrok-домен.
  // В обычной локалке это будет localhost / 127.0.0.1 / *.localhost
  const isNgrok =
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    !!process.env.VITE_NGROK; // опционально: можешь поставить VITE_NGROK=1 когда работаешь через ngrok

  return {
    server: {
      host: true,
      port: 8080,
      strictPort: true,

      // ✅ разрешаем: локалку + subdomain localhost + ngrok
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        ".localhost", // ✅ turko.localhost:8080
        ".ngrok-free.dev",
        ".ngrok.io",
        ".ngrok.app",
      ],

      hmr: {
        overlay: false,
        // ✅ 443 нужно только для ngrok. Локально лучше не трогать.
        ...(isNgrok ? { clientPort: 443 } : {}),
      },

      proxy: {
        // ✅ API
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false, // сохраняем Host (turko.localhost:8080)
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              if (req.headers.host) {
                proxyReq.setHeader("host", req.headers.host);
              }
            });
          },
        },

        // ✅ MEDIA (картинки блюд)
        "/media": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              if (req.headers.host) {
                proxyReq.setHeader("host", req.headers.host);
              }
            });
          },
        },

        // ✅ STATIC (если Django отдаёт статику)
        "/static": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              if (req.headers.host) {
                proxyReq.setHeader("host", req.headers.host);
              }
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
  };
});