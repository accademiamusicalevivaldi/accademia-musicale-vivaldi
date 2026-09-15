import {test} from 'node:test';import assert from 'node:assert/strict';
import {published,renderMarkdown,safeUrl,fitDimensions} from '../src/lib/content.mjs';
test('le bozze non compaiono, le notizie sono ordinate dalla più recente',()=>{assert.deepEqual(published([{title:'old',date:'2026-01-01',draft:false},{title:'draft',date:'2026-03-01',draft:true},{title:'new',date:'2026-02-01',draft:false}]).map(x=>x.title),['new','old']);});
test('testi del CMS non possono eseguire script',()=>{const result=renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>[clic](javascript:alert(1))');assert.ok(!result.includes('<script'));assert.ok(!result.includes('onerror'));assert.ok(!result.includes('href="javascript:'));});
test('URL consentiti e rifiuto di URL eseguibili',()=>{assert.equal(safeUrl('javascript:alert(1)'), '');assert.equal(safeUrl('//evil.it'), '');assert.equal(safeUrl('/media/test.pdf'),'/media/test.pdf');});
test('ridimensiona mantenendo proporzioni senza ingrandire',()=>{assert.deepEqual(fitDimensions(4000,3000,2000),{width:2000,height:1500});assert.deepEqual(fitDimensions(800,600,2000),{width:800,height:600});});
