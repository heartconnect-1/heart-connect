import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PublicSite,{isPublicPath} from './PublicSite';
import { startSupabaseBridge } from './lib/supabase-bridge';
import './index.css';

if('serviceWorker' in navigator&&!window.location.pathname.startsWith('/admin'))window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
startSupabaseBridge();

const pathname=window.location.pathname;
const Root=isPublicPath(pathname)?PublicSite:App;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
