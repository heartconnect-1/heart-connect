import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startSupabaseBridge } from './lib/supabase-bridge';
import './index.css';

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
startSupabaseBridge();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
