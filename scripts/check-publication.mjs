import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const files=['src/content/notizie/qa-pubblicata.json','src/content/notizie/qa-bozza.json','src/content/gallerie/qa-album.json','src/content/documenti/qa-pdf.json'];
if(files.some(f=>fs.existsSync(f)))throw Error('Esistono già file di prova: controllo interrotto per preservarli.');
try{
 const common={title:'Verifica temporanea',date:'2026-09-15',draft:false};
 fs.writeFileSync(files[0],JSON.stringify({...common,excerpt:'Riassunto prova',body:'## Testo verificato\n<script>alert(1)</script>'}));fs.writeFileSync(files[1],JSON.stringify({...common,title:'BOZZA-NON-PUBBLICARE',draft:true}));
 fs.writeFileSync(files[2],JSON.stringify({...common,location:'Caselle',description:'Album di prova',photos:[{url:'/images/copertina.jpg',alt:'Pianoforte'}]}));fs.writeFileSync(files[3],JSON.stringify({...common,category:'Prova',description:'PDF prova',file:'/media/documents/12345678-1234-1234-1234-123456789abc.pdf'}));
 execFileSync('npm',['run','build'],{stdio:'pipe',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'}});
 const html=fs.readFileSync('dist/notizie/qa-pubblicata/index.html','utf8');assert.ok(html.includes('Testo verificato'));assert.ok(!html.includes('alert(1)'));assert.ok(!fs.existsSync('dist/notizie/qa-bozza'));
 assert.ok(fs.readFileSync('dist/gallerie/qa-album/index.html','utf8').includes('photo-link'));assert.ok(fs.readFileSync('dist/documenti/index.html','utf8').includes('123456789abc.pdf'));assert.ok(fs.readFileSync('dist/index.html','utf8').includes('Maestra Vanessa Visentin'));assert.ok(fs.existsSync('dist/_worker.js'));console.log('Verificate pagine articolo, album, PDF, esclusione bozze e Worker.');
}finally{for(const f of files)if(fs.existsSync(f))fs.unlinkSync(f);execFileSync('npm',['run','build'],{stdio:'pipe',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'}});console.log('File di prova rimossi, sito finale ricostruito.');}
