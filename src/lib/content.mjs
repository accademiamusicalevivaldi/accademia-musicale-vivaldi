import {marked} from 'marked';import sanitize from 'sanitize-html';
export const published=items=>items.filter(item=>item.draft===false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
export const safeUrl=value=>typeof value==='string'&&(/^(https?:\/\/|mailto:|tel:)/i.test(value)||/^\/(?!\/)/.test(value)||/^#[\w-]*$/.test(value))?value:'';
export const renderMarkdown=value=>sanitize(marked.parse(value||''),{allowedTags:[...sanitize.defaults.allowedTags,'img'],allowedAttributes:{a:['href','title','rel'],img:['src','alt','width','height','loading']},allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false});
export function fitDimensions(width,height,max){const ratio=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};}
