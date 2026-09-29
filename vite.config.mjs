import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        adminLogin: resolve(__dirname, 'admin-login.html'),
        properties: resolve(__dirname, 'properties.html'),
        propertyDetail: resolve(__dirname, 'property-detail.html'),
        offplan: resolve(__dirname, 'offplan.html'),
        offplanDetail: resolve(__dirname, 'offplan-detail.html'),
        calculator: resolve(__dirname, 'calculator.html'),
        sell: resolve(__dirname, 'sell.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        notFound: resolve(__dirname, '404.html'),
        serverError: resolve(__dirname, '500.html')
      }
    }
  }
});
