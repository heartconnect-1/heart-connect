import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: {
            maxParallelFileOps: 128,
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/@supabase/')) return 'supabase-vendor';
                    if (id.includes('node_modules/lucide-react/')) return 'icons-vendor';
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor';
                    if (id.includes('/src/Stage3Center')) return 'stage3-center';
                    if (id.includes('/src/Stage5Experience')) return 'stage5-experience';
                    if (id.includes('/src/Stage6')) return 'stage6';
                    if (id.includes('/src/Stage7')) return 'stage7';
                    if (id.includes('/src/LocationCenter')) return 'location-center';
                    if (id.includes('/src/AccountSecurityCenter') || id.includes('/src/ComplianceControls')) return 'security-center';
                    return undefined;
                },
            },
        },
    },
});
