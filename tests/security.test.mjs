import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seal,unseal,validOrigin,allowedFile,validKey} from '../server/security.mjs';
test('sessione cifrata non espone il token e non accetta alterazioni',async()=>{
 const secret='a'.repeat(40);const value=await seal({token:'private-token',exp:Date.now()+10000},secret);
 assert.ok(!value.includes('private-token'));assert.equal((await unseal(value,secret)).token,'private-token');
 assert.equal(await unseal(value+'X',secret),null);assert.equal(await unseal(value,'b'.repeat(40)),null);
});
test('sessioni scadute rifiutate',async()=>{assert.equal(await unseal(await seal({exp:1},'a'.repeat(40)),'a'.repeat(40)),null);});
test('upload rifiuta richieste cross origin e senza origine',()=>{
 assert.equal(validOrigin(new Request('https://school.it/api/media',{headers:{Origin:'https://evil.it'}}),'https://school.it'),false);
 assert.equal(validOrigin(new Request('https://school.it/api/media'),'https://school.it'),false);
 assert.equal(validOrigin(new Request('https://school.it/api/media',{headers:{Origin:'https://school.it'}}),'https://school.it'),true);
});
test('limiti e tipi file, nessun SVG/HTML attivo',()=>{
 assert.equal(allowedFile('image/webp',200000),true);assert.equal(allowedFile('application/pdf',10),true);
 assert.equal(allowedFile('image/svg+xml',100),false);assert.equal(allowedFile('text/html',100),false);
 assert.equal(allowedFile('video/mp4',60*1024*1024),false);
 assert.equal(allowedFile('image/png',0),false);
});
test('percorsi media vincolati, nessun traversal',()=>{assert.equal(validKey('images/12345678-abcd-1234-abcd-123456789abc.webp'),true);assert.equal(validKey('../secret'),false);assert.equal(validKey('images/test.html'),false);});
