import {adminHtml as adminHtmlV34} from './admin-ui-v34.js';

export function adminHtml(version){
  const upgrade=`<style>
/* v35: make Page Templates unmistakably visible/clickable */
.hc33-template-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
.hc33-template{
  position:relative!important;
  display:grid!important;
  grid-template-columns:46px 1fr auto!important;
  align-items:center!important;
  gap:12px!important;
  width:100%!important;
  min-height:88px!important;
  padding:14px!important;
  text-align:left!important;
  border:2px solid #3b82f6!important;
  background:linear-gradient(145deg,#14263d,#0b1421)!important;
  border-radius:16px!important;
  color:#fff!important;
  box-shadow:0 8px 24px #0005, inset 0 0 0 1px #ffffff0b!important;
  opacity:1!important;
  filter:none!important;
  cursor:pointer!important;
  transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease!important
}
.hc33-template:hover,.hc33-template:focus-visible{
  transform:translateY(-2px)!important;
  border-color:#79bdff!important;
  background:linear-gradient(145deg,#193454,#0d1b2c)!important;
  box-shadow:0 12px 32px #0007,0 0 0 3px #419cff25!important;
  outline:none!important
}
.hc33-template::before{
  display:grid!important;
  place-items:center!important;
  width:44px!important;
  height:44px!important;
  border-radius:12px!important;
  background:#ffffff12!important;
  border:1px solid #ffffff1f!important;
  font-size:21px!important;
  content:'📄'!important
}
.hc33-template[data-template="home"]::before{content:'🏠'!important}
.hc33-template[data-template="content"]::before{content:'📝'!important}
.hc33-template[data-template="legal"]::before{content:'⚖️'!important}
.hc33-template[data-template="help"]::before{content:'❓'!important}
.hc33-template[data-template="landing"]::before{content:'🚀'!important}
.hc33-template::after{
  content:'Choose'!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid #60a5fa55!important;
  background:#2563eb22!important;
  color:#a9d4ff!important;
  border-radius:999px!important;
  padding:6px 9px!important;
  font-size:9px!important;
  font-weight:900!important;
  letter-spacing:.03em!important
}
.hc33-template b{
  display:block!important;
  color:#fff!important;
  font-size:14px!important;
  font-weight:900!important;
  line-height:1.2!important;
  text-transform:capitalize!important;
  opacity:1!important;
  filter:none!important
}
.hc33-template small{
  display:block!important;
  color:#b9c9dc!important;
  font-size:10px!important;
  line-height:1.45!important;
  margin-top:5px!important;
  opacity:1!important;
  filter:none!important
}
@media(max-width:760px){.hc33-template-grid{grid-template-columns:1fr!important}}
@media(max-width:420px){.hc33-template{grid-template-columns:40px 1fr!important}.hc33-template::after{grid-column:2;justify-self:start}.hc33-template::before{width:38px!important;height:38px!important}}
</style>`;
  return adminHtmlV34(version).replace('</head>',upgrade+'</head>');
}
