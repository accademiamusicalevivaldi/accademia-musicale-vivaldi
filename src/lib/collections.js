import {published} from './content.mjs';
function collect(files){return Object.entries(files).map(([path,value])=>({...value,slug:path.split('/').pop().replace(/\.json$/,'')}));}
export const news=published(collect(import.meta.glob('../content/notizie/*.json',{eager:true,import:'default'})));
export const albums=published(collect(import.meta.glob('../content/gallerie/*.json',{eager:true,import:'default'})));
export const documents=published(collect(import.meta.glob('../content/documenti/*.json',{eager:true,import:'default'})));
export const formatDate=value=>new Intl.DateTimeFormat('it-IT',{dateStyle:'long',timeZone:'UTC'}).format(new Date(value));
