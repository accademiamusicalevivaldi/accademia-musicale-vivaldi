import {validKey} from '../../server/security.mjs';
export async function onRequest({request,env}){
 if(!['GET','HEAD'].includes(request.method))return new Response('Metodo non consentito',{status:405});
 const key=new URL(request.url).pathname.slice('/media/'.length);
 if(!validKey(key))return new Response('File non trovato',{status:404});
 if(!env.MEDIA)return new Response('Archivio non disponibile',{status:503});
 try{
  const meta=await env.MEDIA.head(key);if(!meta)return new Response('File non trovato',{status:404});
  const headers=new Headers({'Content-Type':meta.httpMetadata?.contentType||'application/octet-stream','ETag':meta.httpEtag,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'});
  if(request.headers.get('If-None-Match')===meta.httpEtag)return new Response(null,{status:304,headers});
  const range=request.headers.get('Range');let options;let status=200;
  if(range&&request.method==='GET'){
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${meta.size}`}});
   const start=match[1]?Number(match[1]):Math.max(0,meta.size-Number(match[2]));const end=match[1]&&match[2]?Math.min(Number(match[2]),meta.size-1):meta.size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=meta.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${meta.size}`}});
   options={range:{offset:start,length:end-start+1}};headers.set('Content-Range',`bytes ${start}-${end}/${meta.size}`);headers.set('Content-Length',String(end-start+1));status=206;
  }else headers.set('Content-Length',String(meta.size));
  if(key.endsWith('.pdf')) {
  headers.set('Content-Disposition', 'inline; filename="materiale-didattico.pdf"');
}
  if(request.method==='HEAD')return new Response(null,{headers});
  const object=await env.MEDIA.get(key,options);if(!object)return new Response('File non trovato',{status:404});return new Response(object.body,{status,headers});
 }catch{return new Response('Archivio temporaneamente non disponibile',{status:502});}
}
