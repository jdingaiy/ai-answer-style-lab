import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gapSource} from '../dist/model.js';
test('gap annotations identify the effective spacing rule',()=>{const c=preset();c.body.after=16;c.h3.before=24;assert.equal(gapSource(c,'body','h3'),'H3段前');c.h3.before=8;assert.equal(gapSource(c,'body','h3'),'正文段后');c.h3.before=16;assert.equal(gapSource(c,'body','h3'),'正文段后 = H3段前');c.tightTitles=true;assert.equal(gapSource(c,'h2','h3'),'父子标题间距');c.hr.after=32;assert.equal(gapSource(c,'hr','h3'),'分割线段后');});
test('images have independent spacing and CSS rules',()=>{const c=preset();c.image.before=18;c.image.after=12;c.h2.before=12;assert.equal(blockGap(c,'body','image'),18);assert.equal(gapSource(c,'image','h2'),'图片段后 = H2段前');assert.match(buildCSS(c),/\.markdown-body figure\.md-image\{[^}]*margin-block-start:18px/);});
test('bounded cells and canonical markdown-body CSS',()=>{const c=preset('web'),css=buildCSS(c);assert.match(css,/\.markdown-body \.md-cell\{[^}]*max-width:280px/);assert.match(css,/\.markdown-body \.md-table > table\{min-width:100%/);assert.doesNotMatch(css,/\.answer/);const html=renderMarkdown('| 项目 | 说明 |\n| --- | --- |\n| A | 很长的说明 |');assert.equal((html.match(/class="md-cell"/g)||[]).length,4);assert.equal(normalize({columnMin:300,columnMax:100},'app').columnMax,300);});
import {preset,switchUnit,blockGap,buildCSS,buildLegacyCSS,renderMarkdown,normalize,sample} from '../dist/model.js';
test('px and multiplier round trip preserves equivalent line height',()=>{const style=preset().body;const times=switchUnit(style,'multiplier');assert.equal(times.line,1.7);assert.equal(switchUnit(times,'px').line,25.5);assert.equal(switchUnit({...times,size:20},'px').line,34);});
test('blocks use max not sum; divider and title precedence',()=>{const c=preset();c.body.after=16;c.quote.before=24;assert.equal(blockGap(c,'body','quote'),24);c.hr.before=32;c.hr.after=20;assert.equal(blockGap(c,'body','hr'),32);assert.equal(blockGap(c,'hr','h2'),20);c.tightTitles=true;assert.equal(blockGap(c,'h2','h3'),8);assert.equal(blockGap(c,'body','h3'),16);});
test('independent scene and table typography are emitted',()=>{const c=preset('app');c.thead.size=20;c.table.size=13;c.table.unit='multiplier';c.table.line=1.8;const css=buildCSS(c);assert.match(css,/\.markdown-body th\{[^}]*font-size:20px/);assert.match(css,/\.markdown-body td\{[^}]*line-height:1.8;/);assert.equal(preset('web').body.size,15);assert.equal(preset('app').body.size,17);});
test('GFM sample supports headings, nested lists, tables, code and rule',()=>{const html=renderMarkdown(sample);for(const tag of ['h1','h2','h3','h4','h5','h6','ol','ul','blockquote','table','pre','hr'])assert.match(html,new RegExp('<'+tag+'[ >]'));assert.match(html,/class="md-table"/);assert.match(html,/type="checkbox"/);});
test('raw HTML and unsafe links cannot execute; safe images render',()=>{const html=renderMarkdown('<img src=x onerror=alert(1)>\n\n[x](javascript:alert)\n\n![示例](https://example.com/a.png)\n\n![坏图](javascript:alert(1))\n\n[x](https://example.com)');assert.doesNotMatch(html,/<img[^>]*src="x"|href="javascript:|onerror="/);assert.match(html,/&lt;img/);assert.match(html,/<img src="https:\/\/example.com\/a.png" alt="示例" loading="lazy"/);assert.match(html,/\[图片：坏图\]/);assert.match(html,/rel="noopener noreferrer"/);});
test('image rows use responsive three-column square crops, configurable gap and align with list text',()=>{const html=renderMarkdown('![图一](https://example.com/a.png)\n\n![图二](https://example.com/b.png)\n\n- 列表文字\n\n  ![列表图片](https://example.com/c.png)');assert.match(html,/<figure class="md-image md-image-group"><img[^>]+><img[^>]+><\/figure>/);assert.match(html,/<li>[\s\S]*<figure class="md-image">/);const c=preset();c.image.gap=12;const css=buildCSS(c);assert.match(css,/figure\.md-image\{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:12px;width:min\(100%, 440px\);max-width:440px/);assert.match(css,/figure\.md-image img\{[^}]*flex:0 0 calc\(\(100% - 24px\) \/ 3\);width:calc\(\(100% - 24px\) \/ 3\);aspect-ratio:1 \/ 1;height:auto;max-width:none[^}]*border-radius:4px[^}]*object-fit:cover/);assert.match(css,/li > figure\.md-image\{width:min\(100%, 440px\);max-width:440px;margin-inline:0;padding-inline:0/);});
test('image groups are chunked at three images',()=>{const html=renderMarkdown('![一](https://example.com/1.png) ![二](https://example.com/2.png) ![三](https://example.com/3.png) ![四](https://example.com/4.png)');assert.equal((html.match(/<figure class="md-image(?: md-image-group)?">/g)||[]).length,2);assert.equal((html.match(/class="md-image md-image-group"/g)||[]).length,1);assert.equal((html.match(/<img\b/g)||[]).length,4);});
test('legacy images share the current image format and use legacy table spacing',()=>{const css=buildLegacyCSS('web');assert.match(css,/\.legacy-layer pre,\.legacy-layer \.md-table,\.legacy-layer figure\.md-image\{margin:0 0 16px!important;/);assert.doesNotMatch(css,/\.legacy-layer img\{/);});
test('tight ordered and unordered list images are wrapped as horizontal thumbnail rows',()=>{for(const marker of ['-','1.']){const html=renderMarkdown(`${marker} 列表文字\n   ![图一](https://example.com/a.png)\n   ![图二](https://example.com/b.png)`);assert.match(html,/<li>列表文字\s*<figure class="md-image md-image-group"><img[^>]+>\s*<img[^>]+><\/figure><\/li>/);}});
test('stored preferences are clamped and cannot inject CSS',()=>{const c=normalize({sizeVersion:1,body:{size:999,color:'red;}body{display:none',font:'evil',line:-1,unit:'px'},width:4},'web');assert.equal(c.body.size,64);assert.equal(c.body.color,'#191b1f');assert.equal(c.body.line,10);assert.equal(c.width,280);});
test('mark renders Chinese text, nested emphasis and line breaks',()=>{const html=renderMarkdown('<mark>结合你的89㎡两居室需求，优先选择**半包＋独立设计师**\n并保留*应急空间*</mark>。');assert.match(html,/<mark>结合你的89㎡/);assert.match(html,/<strong>半包＋独立设计师<\/strong>/);assert.match(html,/<em>应急空间<\/em><\/mark>/);});
test('mark strips attributes and stays escaped in code',()=>{const html=renderMarkdown('<mark onclick="alert(1)" style="position:fixed">重点</mark>\n\n`<mark>代码</mark>`\n\n~~~html\n<mark>代码块</mark>\n~~~');assert.match(html,/<mark>重点<\/mark>/);assert.doesNotMatch(html,/onclick|position:fixed/);assert.match(html,/<code>&lt;mark&gt;代码&lt;\/mark&gt;<\/code>/);assert.match(html,/&lt;mark&gt;代码块&lt;\/mark&gt;/);});
test('mark colors migrate from old preferences and reject CSS injection',()=>{const c=normalize({colorVersion:1,body:{size:18},mark:{styleVersion:2,background:'red;}body{display:none',color:'#123456'}},'web');assert.equal(c.mark.background,'#574cf8');assert.equal(c.mark.color,'#123456');assert.match(buildCSS(c),/\.markdown-body mark\{background-color:transparent;.*color:#123456;/);assert.deepEqual(normalize({},'app').mark,preset('app').mark);});
test('highlight and mark have distinct reference styles and safe markup',()=>{const c=preset();const css=buildCSS(c);assert.match(css,/background-size:100% .5em/);assert.match(css,/highlight\{display:inline;background-color:color-mix\(in srgb, var\(--MapAI\) 10%, transparent\)/);const html=renderMarkdown('<highlight onclick="x()">**高亮强调**</highlight> 和 <mark>标记</mark>');assert.match(html,/<highlight><strong>高亮强调<\/strong><\/highlight>/);assert.doesNotMatch(html,/onclick/);const migrated=normalize({sizeVersion:1,body:{size:19},mark:{background:'#fff2a8',color:'#111111'}},'web');assert.equal(migrated.body.size,19);assert.equal(migrated.mark.background,'#574cf8');});
test('standalone mark block keeps emphasis and strips unsafe attributes',()=>{const html=renderMarkdown('<mark onclick="evil()">\n高亮 **内容**\n</mark>');assert.match(html,/<mark>\n高亮 <strong>内容<\/strong>\n<\/mark>/);assert.doesNotMatch(html,/onclick|evil/);});
test('existing scene parameters are preserved when mark settings are introduced',()=>{for(const scene of ['web','app','card']){const old=preset(scene);delete old.mark;old.body.size=19;old.body.line=1.85;old.body.unit='multiplier';old.h3.before=23;old.table.after=31;old.hr.before=19;old.hr.after=29;old.width=420;const migrated=normalize(JSON.parse(JSON.stringify(old)),scene);const {mark,...retained}=migrated;assert.deepEqual(retained,old);assert.deepEqual(mark,preset(scene).mark);}});

import {cssTemplate} from '../dist/model.js';
test('scene typography migrates once and templates use the screenshot sizes',()=>{
  const expected={web:[15,19,17,15,15,15,15],app:[17,19,18,17,17,17,17],card:[15,17,16,15,15,15,15]};
  for(const scene of Object.keys(expected)){
    const c=normalize({spacingVersion:1,body:{size:21,after:23},h1:{before:31}},scene);
    assert.deepEqual(['body','h1','h2','h3','h4','h5','h6'].map(k=>c[k].size),expected[scene]);
    assert.equal(c.body.after,23);assert.equal(c.h1.before,31);
    const template=cssTemplate(c,scene);
    assert.deepEqual(['body','h1','h2','h3','h4','h5','h6'].map(k=>template[k].size),expected[scene]);
    c.h1.size=25;assert.equal(normalize(c,scene).h1.size,25);
  }
});

test('scene spacing matches the design table and persists after editing',()=>{
 for(const [scene,divider,before,after,bodyAfter,moduleGap] of [
 ['web',20,[20,16,12,12,12,12],[10,8,6,6,6,6],8,12],
 ['app',18,[18,14,10,10,10,10],[10,8,6,6,6,6],8,12],
 ['card',16,[16,12,8,8,8,8],[8,6,4,4,4,4],6,10]]){
  for(const c of [preset(scene),normalize({hr:{before:99},h3:{after:99}},scene),cssTemplate(preset(scene),scene)]){
   assert.equal(c.hr.before,divider);assert.equal(c.hr.after,divider);
   for(let i=1;i<=6;i++){assert.equal(c['h'+i].before,before[i-1]);assert.equal(c['h'+i].after,after[i-1]);}
   for(const key of ['body','ol','ul']){assert.equal(c[key].before,0);assert.equal(c[key].after,bodyAfter);}
   for(const key of ['image','code','table']){assert.equal(c[key].before,moduleGap);assert.equal(c[key].after,moduleGap);}
   assert.equal(c.quote.before,10);assert.equal(c.quote.after,10);
   c.h3.before=37;assert.equal(normalize(c,scene).h3.before,37);
  }
 }
});

test('MapAI backgrounds migrate independently of typography and use alpha only on backgrounds',()=>{
 const old=preset('app');delete old.aiColorVersion;old.mark.background='#dcd7ff';old.highlight.background='#efecff';old.h1.size=23;old.body.after=9;
 const c=normalize(old,'app'),css=buildCSS(c);
 assert.equal(c.mark.background,'#574cf8');assert.equal(c.highlight.background,'#574cf8');
 assert.equal(c.h1.size,23);assert.equal(c.body.after,9);
 assert.ok(css.includes('--MapAI:#574cf8;'));
 assert.ok(css.includes('color-mix(in srgb, var(--MapAI) 20%, transparent)'));
 assert.ok(css.includes('color-mix(in srgb, var(--MapAI) 10%, transparent)'));
 assert.doesNotMatch(css,/opacity:/);
});

test('Figma text tokens migrate across scenes once while retaining custom colors and layout',()=>{
 for(const scene of ['web','app','card']){
  const old=preset(scene);delete old.textColorVersion;
  for(const key of ['body','h1','h2','h3','h4','h5','h6','ol','ul','quote','code','table','thead','image','mark','highlight'])old[key].color='#36393F';
  old.body.size=23;old.h3.before=31;old.table.color='#123456';
  const c=normalize(old,scene),css=buildCSS(c);
  assert.equal(c.body.color,'#191b1f');assert.equal(c.quote.color,'#81858f');
  assert.equal(c.mark.color,'#191b1f');assert.equal(c.highlight.color,'#191b1f');
  assert.equal(c.table.color,'#123456');assert.equal(c.body.size,23);assert.equal(c.h3.before,31);
  assert.ok(css.includes('--MapText02A:#191b1f;--MapText05A:#81858f;'));
  assert.match(css,/blockquote\{[^}]*color:var\(--MapText05A\)/);
  assert.match(css,/\.markdown-body p\{[^}]*color:var\(--MapText02A\)/);
  assert.match(css,/--MapText03A:#36393f/);
  assert.deepEqual(normalize(c,scene),c);
  c.body.color='#36393f';c.quote.color='#654321';
  const edited=normalize(c,scene);assert.equal(edited.body.color,'#36393f');assert.equal(edited.quote.color,'#654321');
  assert.equal(preset(scene).quote.color,'#81858f');
 }
});


import {experimentConfig,experimentVersions,selectors} from '../dist/model.js';
import {defaultSnapshot} from '../dist/default-config.js';
test('experiment groups preserve baseline spacing, colors and typography through persistence',()=>{
 for(const scene of ['web','app','card']){
  const raw=defaultSnapshot.configs[scene];
  const control=experimentConfig(scene,'experiment-control',raw);
  const one=experimentConfig(scene,'experiment-one',raw);
  const two=experimentConfig(scene,'experiment-two',raw);
  for(const [group,c] of Object.entries({'experiment-control':control,'experiment-one':one,'experiment-two':two})){
   assert.deepEqual(normalize(JSON.parse(JSON.stringify(c)),scene),c);
   assert.equal(c.quote.size,group==='experiment-two'?16:15);
   const css=buildCSS(c);
   if(group==='experiment-control')assert.match(css,/ul > li::marker\{color:inherit;/);else assert.match(css,/ul > li::marker\{color:var\(--MapUIFrame09A\)/);
   assert.ok(css.includes(`strong{font-weight:${c.h1.weight};}`));
   assert.ok(css.includes(`color:var(--${group==='experiment-control'?'MapText03A':'MapText02A'});`));
  }
  if(scene==='card'){
   assert.equal(one.body.size,15);assert.equal(two.body.size,16);
   assert.equal(two.h1.size,18);assert.equal(two.body.line,1.7);
   for(const key of Object.keys(selectors))assert.deepEqual([two[key].before,two[key].after],[one[key].before,one[key].after]);
   assert.equal(control.body.after,8);assert.equal(one.body.after,6);
  }
 }
 assert.equal(Object.keys(experimentVersions).length,3);
});

test('saved experiment two migrates legacy spacing once and preserves later edits',()=>{
 const c=experimentConfig('card','experiment-two',defaultSnapshot.configs.card);
 delete c.experimentVersion;c.body.after=8;c.h1.before=0;c.image.after=16;
 const migrated=normalize(c,'card');
 assert.equal(migrated.body.after,6);assert.equal(migrated.h1.before,16);assert.equal(migrated.image.after,10);
 assert.equal(migrated.body.size,16);assert.equal(migrated.h1.size,18);
 migrated.body.after=9;assert.equal(normalize(migrated,'card').body.after,9);
});

test('both experiments use 1.7 line height in every scene, migrate once and preserve control',()=>{
 for(const scene of ['web','app','card']){
  for(const group of ['experiment-one','experiment-two']){
   const c=experimentConfig(scene,group,defaultSnapshot.configs[scene]);
   for(const key of ['body','h1','h2','h3','h4','h5','h6','ol','ul','quote','code','table','thead'])assert.deepEqual([c[key].line,c[key].unit],[1.7,'multiplier']);
   c.experimentVersion=2;c.quote.line=24;c.quote.unit='px';c.body.line=1.6;c.body.after=11;
   const migrated=normalize(c,scene);assert.equal(migrated.body.line,1.7);assert.equal(migrated.quote.line,1.7);assert.equal(migrated.body.after,11);
   migrated.body.line=1.8;assert.equal(normalize(migrated,scene).body.line,1.8);
  }
  const control=experimentConfig(scene,'experiment-control',defaultSnapshot.configs[scene]);
  assert.equal(control.h1.line,scene==='card'?24:27);assert.equal(control.code.line,17);
 }
});
