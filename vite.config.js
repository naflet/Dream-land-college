
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// SHARED BACKEND HTTPS CERTIFICATES
// =====================================================

const certificateDirectory = path.resolve(
  __dirname,
  "../dream-land-college-backend/certs"
);

const keyPath = path.join(
  certificateDirectory,
  "dev-key.pem"
);

const certPath = path.join(
  certificateDirectory,
  "dev-cert.pem"
);

// =====================================================
// VITE CONFIGURATION
// =====================================================

export default defineConfig(({ command }) => {
  let httpsConfig;

  // HTTPS is required for local development only.
  if (command === "serve") {
    if (
      !fs.existsSync(keyPath) ||
      !fs.existsSync(certPath)
    ) {
      throw new Error(
        "Local HTTPS certificates not found. Start the backend first so it can generate the certificates."
      );
    }

    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  return {
    plugins: [react()],

    // GitHub Pages base path.
    base: "/Dream-land-college/",

    server: {
      // Allow access from other devices on the same network.
      host: "0.0.0.0",

      port: 5173,

      strictPort: true,

      https: httpsConfig,
    },
  };
});
