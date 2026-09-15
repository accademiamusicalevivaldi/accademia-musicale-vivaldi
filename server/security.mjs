const encoder=new TextEncoder();
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function key(secret){if(!secret||secret.length<32)throw new Error('SESSION_SECRET non configurato');return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',encoder.encode(secret)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(value,secret){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(secret),encoder.encode(JSON.stringify(value))));return encode(iv)+'.'+encode(encrypted);}
export async function unseal(value,secret){try{const [iv,data,...extra]=value.split('.');if(extra.length)return null;const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv)},await key(secret),decode(data));const parsed=JSON.parse(new TextDecoder().decode(plain));return parsed.exp>Date.now()?parsed:null;}catch{return null;}}
export function validOrigin(request,origin){return request.headers.get('Origin')===origin;}
export const types={'image/webp':['images','webp',10],'image/jpeg':['images','jpg',10],'image/png':['images','png',10],'application/pdf':['documents','pdf',20],'video/mp4':['videos','mp4',25],'video/webm':['videos','webm',25]};
export function allowedFile(type,size){return Boolean(types[type]&&Number.isFinite(size)&&size>0&&size<=types[type][2]*1024*1024);}
export function validKey(value){return /^(images|documents|videos)\/[a-f0-9-]{36}\.(webp|jpg|png|pdf|mp4|webm)$/.test(value);}
export function cookie(request,name){return request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';}
export function setCookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export function signatureMatches(type,bytes){
 const text=new TextDecoder('latin1').decode(bytes.slice(0,16));
 return type==='application/pdf'?text.startsWith('%PDF-'):type==='image/webp'?text.startsWith('RIFF')&&text.slice(8,12)==='WEBP':type==='image/png'?bytes[0]===137&&text.slice(1,4)==='PNG':type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='video/mp4'?text.slice(4,8)==='ftyp':type==='video/webm'?bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163:false;
}
