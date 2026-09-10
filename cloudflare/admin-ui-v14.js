import {adminHtml as adminHtmlV13} from './admin-ui-v13.js';

function removeInlineScriptContaining(html,marker){
  const blocks=html.match(/<script>[\s\S]*?<\/script>/g)||[];
  for(const block of blocks){
    if(block.includes(marker))return html.replace(block,'');
  }
  return html;
}

export function adminHtml(version){
  let html=adminHtmlV13(version);
  // v11's browser-side page/CMS override contained an invalid multiline string.
  // Keep its styling and the newer v13 upload bridge, but remove that broken
  // inline script so the stable v9/v10 editor can be enhanced safely.
  html=removeInlineScriptContaining(html,"const TYPES=['home','legal','help','landing','content'];");
  return html;
}
