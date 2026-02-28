import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/chicken-mob/',
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        host: true,
        port: 3000,
    },
    build: {
        target: 'es2020',
        outDir: 'dist',
    },
});
