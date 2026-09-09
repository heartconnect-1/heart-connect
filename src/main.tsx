import {StrictMode,Suspense,lazy} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

const MemberApp=lazy(()=>import('./App'));
const CmsPublic=lazy(()=>import('./CmsPublic'));
const AdminDashboard=lazy(()=>import('./AdminDashboard'));
const PublicSite=lazy(()=>import('./PublicSite'));const ServicePages=lazy(()=>import('./ServicePages'));const BookingPortal=lazy(()=>import('./BookingPortal'));const HomePage=lazy(()=>import('./HomePage'));

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

const cleanPath=window.location.pathname.replace(/^\/+|\/+$/g,'');
const fallbackAdmin=new URLSearchParams(window.location.search).get('admin')==='1';
if(fallbackAdmin){const hash=window.location.hash||'#/overview';history.replaceState(null,'','./admin/'+hash)}
const adminRoute=fallbackAdmin||cleanPath==='admin'||cleanPath.startsWith('admin/');
const cmsRoute=!adminRoute&&(/^(blog|success-stories)(?:\/[^/]+)?$/.test(cleanPath)||/^(help|legal)\/[^/]+$/.test(cleanPath)||/^safety\/advice\/[^/]+$/.test(cleanPath));
const homeRoute=!adminRoute&&!cmsRoute&&cleanPath==='';
const appRoutes=new Set(['app','signup','login','forgot-password','reset-password','verify-email','verify-phone']);
const appRoute=!adminRoute&&!cmsRoute&&appRoutes.has(cleanPath);const serviceRoute=!adminRoute&&!cmsRoute&&(cleanPath==='services'||cleanPath.startsWith('services/'));const bookingRoute=!adminRoute&&!cmsRoute&&(cleanPath==='bookings'||cleanPath.startsWith('bookings/'));
if(appRoute){const startBridge=()=>void import('./lib/supabase-bridge').then(m=>m.startSupabaseBridge()).catch(()=>{});if(document.readyState==='complete')setTimeout(startBridge,0);else window.addEventListener('load',startBridge,{once:true})}
const Screen=adminRoute?AdminDashboard:cmsRoute?CmsPublic:homeRoute?HomePage:appRoute?MemberApp:bookingRoute?BookingPortal:serviceRoute?ServicePages:PublicSite;

createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<div style={{minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'system-ui, sans-serif'}}>Loading Heart Connect…</div>}><Screen/></Suspense></StrictMode>);
