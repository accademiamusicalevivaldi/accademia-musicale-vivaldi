import {seal,unseal,cookie,setCookie,validOrigin,allowedFile,types,signatureMatches} from './security.mjs';
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const ready=env=>/^https:\/\/[a-z0-9.-]+$/i.test(env.APP_ORIGIN||'')&&/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPO||'')&&env.GITHUB_CLIENT_ID&&env.GITHUB_CLIENT_SECRET&&env.SESSION_SECRET?.length>=32;
async function github(path,token){return fetch(`https://api.github.com${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','User-Agent':'AccademiaVivaldiCMS','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});}
async function canEdit(token,env){const response=await github(`/repos/${env.GITHUB_REPO}`,token);if(!response.ok)return false;const repo=await response.json();return repo.permissions?.push===true;}
export async function handleApi(request,env){
 const url=new URL(request.url);const path=url.pathname.replace(/^\/api\//,'');
 if(path==='config'&&request.method==='GET')return ready(env)?json({repo:env.GITHUB_REPO,branch:env.GITHUB_BRANCH||'main',origin:env.APP_ORIGIN}):json({error:'Il pannello deve essere collegato al repository GitHub e a Cloudflare. Consulta la guida di pubblicazione.'},503);
 if(!ready(env))return json({error:'Configurazione amministrativa incompleta.'},503);
 if(url.origin!==env.APP_ORIGIN)return json({error:'Utilizza il dominio principale del sito per accedere al pannello.'},403);
 try {
  if(path==='auth'&&request.method==='GET'){
   const nonce=crypto.randomUUID();const state=await seal({nonce,exp:Date.now()+10*60*1000},env.SESSION_SECRET);
   const redirect=new URL('https://github.com/login/oauth/authorize');redirect.searchParams.set('client_id',env.GITHUB_CLIENT_ID);redirect.searchParams.set('redirect_uri',env.APP_ORIGIN+'/api/callback');redirect.searchParams.set('scope','repo');redirect.searchParams.set('state',nonce);
   return new Response(null,{status:302,headers:{Location:redirect.href,'Cache-Control':'no-store','Set-Cookie':setCookie('__Host-vivaldi-state',state,600)}});
  }
  if(path==='callback'&&request.method==='GET'){
   const state=await unseal(cookie(request,'__Host-vivaldi-state'),env.SESSION_SECRET);
   if(!state||!url.searchParams.get('code')||state.nonce!==url.searchParams.get('state'))return json({error:'Accesso scaduto o non valido. Riprova dal pannello.'},403,{'Set-Cookie':setCookie('__Host-vivaldi-state','',0)});
   const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:env.APP_ORIGIN+'/api/callback'}),signal:AbortSignal.timeout(15000)});
   const data=await response.json();if(!response.ok||!data.access_token||!await canEdit(data.access_token,env))return json({error:'Questo account non ha il permesso di modificare il sito.'},403,{'Set-Cookie':setCookie('__Host-vivaldi-state','',0)});
   const session=await seal({token:data.access_token,exp:Date.now()+8*3600000},env.SESSION_SECRET);
   const target=JSON.stringify(env.APP_ORIGIN);const payload=JSON.stringify('authorization:github:success:'+JSON.stringify({token:data.access_token,provider:'github'})).replace(/</g,'\\u003c');const nonce=crypto.randomUUID();
   const html=`<!doctype html><html lang="it"><meta charset="utf-8"><title>Accesso completato</title><p>Accesso completato. Puoi tornare al pannello.</p><script nonce="${nonce}">const target=${target};function receive(e){if(e.origin!==target||e.source!==window.opener)return;window.opener.postMessage(${payload},target);window.removeEventListener('message',receive);window.close();}window.addEventListener('message',receive);if(window.opener)window.opener.postMessage('authorizing:github',target);</script></html>`;
   const headers=new Headers({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'`});headers.append('Set-Cookie',setCookie('__Host-vivaldi-session',session,8*3600));headers.append('Set-Cookie',setCookie('__Host-vivaldi-state','',0));return new Response(html,{headers});
  }
  if(path==='logout'&&request.method==='POST'){
   if(!validOrigin(request,env.APP_ORIGIN))return json({error:'Origine non consentita'},403);
   return json({ok:true},200,{'Set-Cookie':setCookie('__Host-vivaldi-session','',0)});
  }
  if(path==='media'&&request.method==='POST'){
   if(!validOrigin(request,env.APP_ORIGIN))return json({error:'Origine non consentita'},403);
   const session=await unseal(cookie(request,'__Host-vivaldi-session'),env.SESSION_SECRET);
   if(!session?.token)return json({error:'Sessione scaduta: esci e accedi nuovamente al pannello.'},401);
   if(!await canEdit(session.token,env))return json({error:'Non hai il permesso di caricare file.'},403);
   if(!env.MEDIA)return json({error:'Archivio R2 non collegato.'},503);
   const type=request.headers.get('Content-Type')?.split(';')[0]||'';const declared=Number(request.headers.get('Content-Length'));
   if(!types[type]||(declared&& !allowedFile(type,declared)))return json({error:'Tipo o dimensione del file non ammessi.'},413);
   // Read at most the permitted size, including when Content-Length is absent or forged.
   if(!request.body)return json({error:'File mancante.'},400);
   const reader=request.body.getReader();let size=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(!allowedFile(type,size)){await reader.cancel();return json({error:'File troppo grande.'},413);}chunks.push(value);}
   if(!allowedFile(type,size))return json({error:'File vuoto.'},400);
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   if(!signatureMatches(type,bytes))return json({error:'Il contenuto non corrisponde al formato del file.'},415);
   const [folder,extension]=types[type];const name=`${folder}/${crypto.randomUUID()}.${extension}`;
   await env.MEDIA.put(name,bytes,{httpMetadata:{contentType:type},customMetadata:{uploadedAt:new Date().toISOString()}});
   return json({url:'/media/'+name,size,type},201);
  }
  return json({error:'Risorsa non trovata.'},404);
 }catch{return json({error:'Servizio temporaneamente non disponibile. Riprova tra poco.'},502);}
}
