import {adminHtml as adminHtmlV38} from './admin-ui-v38.js';

export function adminHtml(version){
  const upgrade=`<style>
/* v39: readability pass for Automation & AI */
.hc37,.hc38-enhance{font-size:14px}
.hc37-hero h2{font-size:30px}
.hc37-hero p{font-size:14px;line-height:1.7}
.hc37-kicker{font-size:12px}
.hc37-pill,.hc38-pill{font-size:11px;padding:7px 10px}
.hc37-btn,.hc38-btn{font-size:12px;padding:10px 14px;min-height:40px}
.hc37-kpi small,.hc38-card small{font-size:11px}
.hc37-kpi strong{font-size:30px}
.hc37-kpi span,.hc38-card span{font-size:11px;line-height:1.5}
.hc38-card strong{font-size:27px}
.hc37-panel h3,.hc38-head h3{font-size:18px}
.hc37-panel p,.hc38-head p{font-size:12px;line-height:1.65}
.hc37-pipe h4{font-size:14px}
.hc37-pipe small{font-size:11px;line-height:1.55}
.hc37-switch{font-size:12px}
.hc37-config span{font-size:10px;padding:6px 8px}
.hc37-run b{font-size:13px}
.hc37-run span{font-size:11px;line-height:1.55}
.hc37-meta,.hc38-row small,.hc38-row span{font-size:10px}
.hc37-field span,.hc38-field span{font-size:10px}
.hc37-field input,.hc37-field select,.hc37-field textarea,
.hc37-filter input,.hc37-filter select,
.hc38-field select,.hc38-field input{font-size:12px;padding:11px}
.hc37-field textarea{min-height:170px;line-height:1.6}
.hc37-chip{font-size:10px;padding:7px 10px}
.hc37-ai-output pre{font-size:12px;line-height:1.7}
.hc37-note,.hc38-note{font-size:10px;line-height:1.6}
.hc37-draft h4,.hc37-evidence h4{font-size:13px}
.hc37-draft .preview{font-size:11px;line-height:1.65}
.hc37-stat{font-size:10px;padding:6px 8px}
.hc37-empty,.hc38-empty{font-size:11px}
.hc37-empty b{font-size:14px}
.hc37-check b{font-size:12px}
.hc37-check span{font-size:10px;line-height:1.55}
.hc38-stat small{font-size:10px}
.hc38-stat b{font-size:19px}
.hc38-stat span{font-size:10px;line-height:1.5}
.hc38-incident{font-size:11px;line-height:1.6}
.hc38-provider b{font-size:12px}
.hc38-provider small{font-size:10px;line-height:1.5}
.hc38-result{font-size:11px;line-height:1.65}
.hc38-row b{font-size:12px}
.hc38-row{padding:11px;gap:10px}
@media(max-width:760px){
  .hc37,.hc38-enhance{font-size:15px}
  .hc37-hero h2{font-size:27px}
  .hc37-hero p{font-size:14px}
  .hc37-btn,.hc38-btn{font-size:13px}
  .hc37-pill,.hc38-pill{font-size:12px}
  .hc37-kpi small,.hc38-card small{font-size:11px}
  .hc37-kpi span,.hc38-card span{font-size:11px}
  .hc37-panel p,.hc38-head p{font-size:12px}
  .hc37-pipe small,.hc37-run span,.hc37-note,.hc38-note{font-size:11px}
  .hc37-ai-output pre{font-size:13px}
}
</style>`;
  return adminHtmlV38(version).replace('</body>',upgrade+'</body>');
}
