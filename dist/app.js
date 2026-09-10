import {labels,fonts,preset,normalize,switchUnit,buildCSS,renderMarkdown,sample} from './model.js';
import {installGapOverlay} from './gaps.js';
import {defaultSnapshot} from './default-config.js';
const $=id=>document.getElementById(id);
const STORAGE='ai-answer-style-lab-v1',VERSION_LIMIT=30,DEFAULT_CONFIG_VERSION='20260910-native-list-marker-v14';
const scenes={web:'Web · AI 搜索',app:'App · AI 搜索',card:'App · 搜索卡片'};
let scene='web';
let source=defaultSnapshot.source||sample,saveTimer,noticeTimer,storageWarned=false,versions=[],activeVersion='';
let configs=Object.fromEntries(Object.keys(scenes).map(s=>[s,normalize(defaultSnapshot.configs?.[s],s)]));
function applyHeadingRhythm(c){const bodySize=c.body.size,bodyAfter=c.body.after,divider=c.hr.before,lineMultiplier=c.width<=420&&c.width>=380?1.6:1.7;c.body.line=lineMultiplier;c.body.unit='multiplier';const sizes=[bodySize+5,bodySize+3,bodySize+1,bodySize,bodySize,bodySize];const before=[divider,divider-4,divider-6,divider-8,divider-8,divider-8];const after=[bodyAfter+2,bodyAfter,bodyAfter-2,bodyAfter-4,bodyAfter-4,bodyAfter-4];for(let i=1;i<=6;i++){const h=c['h'+i];h.size=sizes[i-1];h.before=Math.max(0,before[i-1]);h.after=Math.max(0,after[i-1]);h.line=lineMultiplier;h.unit='multiplier';}for(const key of ['ol','ul','table','thead']){c[key].line=lineMultiplier;c[key].unit='multiplier';}c.ol.after=bodyAfter;c.ul.after=bodyAfter;for(const key of ['quote','code','table','image'])c[key].after=bodyAfter+4;return c;}
function applyLineRhythm(c,sceneName){const lineMultiplier=sceneName==='card'?1.6:1.7;c.body.line=lineMultiplier;c.body.unit='multiplier';for(const key of ['h1','h2','h3','h4','h5','h6','ol','ul','table','thead']){c[key].line=lineMultiplier;c[key].unit='multiplier';}return c;}
function applyCardSpacing(c,sceneName){c.indent=25;if(sceneName!=='card')return c;c.hr.before=16;c.hr.after=16;c.body.after=6;return applyLineRhythm(applyHeadingRhythm(c),sceneName);}
for(const s of Object.keys(scenes))applyCardSpacing(applyLineRhythm(applyHeadingRhythm(configs[s]),s),s);
function decodeShared(raw){try{const text=decodeURIComponent(escape(atob(raw.replace(/-/g,'+').replace(/_/g,'/'))));return JSON.parse(text);}catch{return null;}}
function encodeShared(value){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
try {const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved){if(saved.defaultConfigVersion===DEFAULT_CONFIG_VERSION){if(Object.hasOwn(scenes,saved.scene))scene=saved.scene;for(const s of Object.keys(scenes))configs[s]=normalize(saved.configs?.[s],s);if(typeof saved.source==='string')source=saved.source;}versions=Array.isArray(saved.versions)?saved.versions.filter(v=>v&&typeof v.id==='string'&&v.configs).map(v=>({id:v.id,name:String(v.name||'未命名版本'),createdAt:v.createdAt||'',source:typeof v.source==='string'?v.source:sample,configs:Object.fromEntries(Object.keys(scenes).map(s=>[s,normalize(v.configs[s],s)]))})):[];activeVersion=typeof saved.activeVersion==='string'?saved.activeVersion:'';}}catch{/* A corrupt or unavailable local preference store does not block editing. */}
for(const s of Object.keys(scenes))applyCardSpacing(applyLineRhythm(applyHeadingRhythm(configs[s]),s),s);
const shared=decodeShared(new URLSearchParams(location.search).get('share')||'');if(shared?.configs){for(const s of Object.keys(scenes))configs[s]=applyCardSpacing(applyLineRhythm(applyHeadingRhythm(normalize(shared.configs[s],s)),s),s);if(typeof shared.source==='string')source=shared.source;activeVersion='';}
const current=()=>configs[scene];
const refreshGaps=installGapOverlay({frame:$('frame'),answer:$('answer'),toggle:$('measure'),getConfig:current});
function notify(text){$('notice').textContent=text;$('notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('show'),2600);}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({defaultConfigVersion:DEFAULT_CONFIG_VERSION,scene,configs,source:$('source').value,versions,activeVersion}));}catch{if(!storageWarned){notify('浏览器未能保存参数，本次编辑仍可继续。');storageWarned=true;}}}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);}
function snapshot(){return {source:$('source').value,configs:Object.fromEntries(Object.keys(scenes).map(s=>[s,JSON.parse(JSON.stringify(configs[s]))]))};}
function renderVersions(){const select=$('version');select.innerHTML='<option value="">当前编辑（未保存）</option>'+versions.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');select.value=activeVersion;}
function createVersion(){const name=prompt('给这组三端参数命名',`版本 ${versions.length+1}`)?.trim();if(!name)return;const snap=snapshot(),v={id:`v-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,createdAt:new Date().toISOString(),...snap};versions=[v,...versions].slice(0,VERSION_LIMIT);activeVersion=v.id;renderVersions();persist();notify(`已保存版本「${name}」，包含 Web、App、卡片三套参数。`);}
async function shareVersion(){const name=activeVersion?(versions.find(v=>v.id===activeVersion)?.name||'已保存版本'):'当前调试版本';const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('share',encodeShared({...snapshot(),name}));try{await navigator.clipboard.writeText(url.toString());notify('分享链接已复制，发送给别人即可还原当前版本。');}catch{prompt('复制下面的分享链接',url.toString());}}
function loadVersion(id){if(!id){activeVersion='';renderVersions();return;}const v=versions.find(item=>item.id===id);if(!v)return;configs=Object.fromEntries(Object.keys(scenes).map(s=>[s,normalize(v.configs[s],s)]));source=v.source;activeVersion=v.id;$('source').value=source;$('scene').value=scene;renderControls(false);renderStyle();renderContent();persist();notify(`已切换到版本「${v.name}」。`);}
function numberField(label,key,value,{min=0,max=160,step=1,unit='px'}={}){return `<label class="field"><span>${label}</span><span class="input-unit"><input aria-label="${label}" type="number" data-key="${key}" value="${Number(value.toFixed(4))}" min="${min}" max="${max}" step="${step}"><span class="unit">${unit}</span></span></label>`;}
function selectField(label,key,value,options){return `<label class="field"><span>${label}</span><select data-key="${key}">${Object.entries(options).map(([k,v])=>`<option value="${k}" ${String(value)===k?'selected':''}>${v}</option>`).join('')}</select></label>`;}
function colorField(label,key,value){return `<label class="field"><span>${label}</span><input aria-label="${label}" type="color" data-key="${key}" value="${value}"></label>`;}
function textFields(key,s){return selectField('字体',`${key}.font`,s.font,{system:'系统字体',serif:'宋体 / 衬线',mono:'等宽字体'})+numberField('字号',`${key}.size`,s.size,{min:10,max:64})+`<label class="field"><span>行高</span><span class="line-input"><input aria-label="${labels[key]}行高" type="number" data-key="${key}.line" value="${Number(s.line.toFixed(4))}" min="${s.unit==='px'?10:.8}" max="${s.unit==='px'?160:6}" step="any"><select aria-label="${labels[key]}行高单位" data-key="${key}.unit"><option value="px" ${s.unit==='px'?'selected':''}>px</option><option value="multiplier" ${s.unit==='multiplier'?'selected':''}>倍</option></select></span></label>`+selectField('字重',`${key}.weight`,s.weight,{'400':'400 · 常规','500':'500 · 中等','600':'600 · 半粗','700':'700 · 加粗'})+colorField('文字颜色',`${key}.color`,s.color);}
function spacingFields(key,s){return numberField('段前',`${key}.before`,s.before)+numberField('段后',`${key}.after`,s.after);}
function section(id,title,content,open){return `<details class="control-section" data-section="${id}" ${open?'open':''}><summary>${title}</summary><div class="section-content">${content}</div></details>`;}
function renderControls(preserve=true){
  const open=new Set([...$('controls').querySelectorAll('details[open]')].map(el=>el.dataset.section));const c=current();
  let html=section('layout','画布与间距',numberField('预览宽度','width',c.width,{min:280,max:1200})+numberField('左右留白','padding',c.padding,{max:80})+`<p class="hint">相邻间距 = 上一块段后与下一块段前的较大值。容器首尾不留额外空白。</p><label class="field"><span>父子标题紧凑排列</span><input type="checkbox" data-key="tightTitles" ${c.tightTitles?'checked':''}></label>`+numberField('父子标题间距','tight',c.tight,{max:80})+`<p class="hint">开启后，仅连续的父→子标题使用此值，覆盖这两个标题之间的段前／段后。</p>`,preserve?open.has('layout'):true);
  for(const [key,label] of Object.entries(labels)){
    let fields=key==='hr'?'':textFields(key,c[key]);
    if(key!=='thead')fields+=spacingFields(key,c[key]);
    if(key==='ol')fields+=numberField('列表项间距','itemGap',c.itemGap,{max:80})+numberField('列表左缩进','indent',c.indent,{min:25,max:80})+`<button class="wide-button" id="sync-spacing">将段前／段后应用到引用、代码、表格</button><p class="hint">有序列表和无序列表统一使用此缩进值。</p>`;
    if(key==='ul')fields+=`<p class="hint">圆点使用浏览器原生列表样式；列表项间距与左缩进沿用有序列表设置。</p>`;
    if(key==='table')fields+=numberField('单元格内边距','cellPadding',c.cellPadding,{max:40})+numberField('列内容最小宽度','columnMin',c.columnMin,{min:40,max:400})+numberField('列内容最大宽度','columnMax',c.columnMax,{min:80,max:600})+`<p class="hint">短内容按需占宽，长内容达到上限后换行；表格总宽超出时左右滑动。列宽另加两侧内边距。</p>`;
    if(key==='hr')fields+=numberField('线条粗细','ruleWidth',c.ruleWidth,{min:1,max:8})+colorField('线条颜色','ruleColor',c.ruleColor)+`<p class="hint">上下两侧分别参与相邻间距计算，分割线本身不再附带默认 margin。</p>`;
    html+=section(key,label,fields,preserve?open.has(key):['body','h1','h2'].includes(key));
  }
  html+=section('highlight','Highlight · 高亮',colorField('高亮底色','highlight.background',c.highlight.background)+colorField('文字颜色','highlight.color',c.highlight.color)+`<p class="hint">&lt;highlight&gt;高亮强调&lt;/highlight&gt;：浅紫色整块底色，保留文字原有字重。</p>`,preserve?open.has('highlight'):true)+section('mark','Mark · 标记',colorField('底部标记颜色','mark.background',c.mark.background)+colorField('文字颜色','mark.color',c.mark.color)+`<p class="hint">&lt;mark&gt;这是标记内容&lt;/mark&gt;：加粗文字，底部紫色标记，支持跨行。</p>`,preserve?open.has('mark'):true);
  $('controls').innerHTML=html;
}
function renderStyle(){const c=current(),css=buildCSS(c);$('live-css').textContent=css;const preview=$('css-preview'),top=preview.scrollTop,left=preview.scrollLeft;preview.value=css;preview.scrollTop=top;preview.scrollLeft=left;$('css-hint').textContent=`${scenes[scene]} · 随参数实时更新 · 作用于 .markdown-body`;$('frame').dataset.scene=scene;$('frame').style.maxWidth=c.width+'px';$('frame').style.paddingInline=c.padding+'px';$('scene-status').textContent=`${scenes[scene]} · ${c.width} px`;refreshGaps();}
function renderContent(){const text=$('source').value;$('char-count').textContent=`${text.length.toLocaleString()} 字符`;try{$('answer').innerHTML=renderMarkdown(text);}catch{$('answer').textContent='这段内容暂时无法解析，请检查 Markdown 格式。';}refreshGaps();}
$('controls').addEventListener('input',event=>{
  const el=event.target,key=el.dataset.key;if(!key||el.tagName==='SELECT')return;
  const parts=key.split('.'),target=parts.length===2?current()[parts[0]]:current(),prop=parts.at(-1);
  if(el.type==='number'){if(el.value===''||!Number.isFinite(el.valueAsNumber)||!el.validity.valid)return;target[prop]=el.valueAsNumber;}
  else if(el.type==='checkbox')target[prop]=el.checked;
  else target[prop]=el.value;
  if(key==='columnMin' && current().columnMax<current().columnMin){current().columnMax=current().columnMin;$('controls').querySelector('[data-key="columnMax"]').value=current().columnMax;}
  if(key==='columnMax' && current().columnMin>current().columnMax){current().columnMin=current().columnMax;$('controls').querySelector('[data-key="columnMin"]').value=current().columnMin;}
  renderStyle();save();
});
$('controls').addEventListener('change',event=>{
  const el=event.target,key=el.dataset.key;if(!key)return;
  const parts=key.split('.');
  if(el.tagName==='SELECT'){
    const [group,prop]=parts;
    if(prop==='unit'){current()[group]=switchUnit(current()[group],el.value);renderControls();}
    else current()[group][prop]=prop==='weight'?Number(el.value):el.value;
    renderStyle();save();
  }else if(el.type==='number' && (el.value===''||!el.validity.valid)){
    const value=parts.length===2?current()[parts[0]][parts[1]]:current()[key];el.value=Number(value.toFixed(4));notify('请输入范围内的有效数值。');
  }
});
$('controls').addEventListener('click',event=>{if(event.target.id==='sync-spacing'){const {before,after}=current().ol;for(const key of ['quote','code','table'])Object.assign(current()[key],{before,after});renderControls();renderStyle();save();notify('已同步引用、代码和表格的段前／段后。');}});
$('scene').value=scene;$('scene').addEventListener('change',()=>{scene=$('scene').value;renderControls();renderStyle();save();});
$('version').addEventListener('change',()=>loadVersion($('version').value));
$('save-version').addEventListener('click',createVersion);
$('share-version').addEventListener('click',shareVersion);
$('delete-version').addEventListener('click',()=>{if(!activeVersion)return notify('当前还没有选中的保存版本。');const v=versions.find(item=>item.id===activeVersion);if(!confirm(`删除版本「${v?.name||''}」？`))return;versions=versions.filter(item=>item.id!==activeVersion);activeVersion='';renderVersions();persist();notify('已删除保存版本。');});
$('source').value=source;$('source').addEventListener('input',()=>{renderContent();save();});
$('measure').addEventListener('change',()=>$('answer').classList.toggle('measuring',$('measure').checked));
$('reset').addEventListener('click',()=>{configs[scene]=preset(scene);renderControls();renderStyle();save();notify('已重置当前场景，Markdown 内容保持不变。');});
$('copy-css').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('css-preview').value);notify('已复制当前场景的 CSS。');}catch{$('css-preview').focus();$('css-preview').select();notify('已选中完整 CSS，请按 Ctrl+C 或 ⌘C 复制。');}});
$('export').addEventListener('click',()=>{const blob=new Blob([buildCSS(current())],{type:'text/css;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ai-answer-${scene}.css`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('当前场景的样式已导出。');});
renderVersions();renderControls(false);renderStyle();renderContent();
