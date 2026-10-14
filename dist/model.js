import { Marked } from './vendor/marked.js';

export const labels = { body:'正文', h1:'H1 · 一级标题', h2:'H2 · 二级标题', h3:'H3 · 三级标题', h4:'H4 · 四级标题', h5:'H5 · 五级标题', h6:'H6 · 六级标题', ol:'有序列表', ul:'无序列表', quote:'引用', code:'代码块', table:'表格正文', thead:'表格表头', image:'图片', hr:'分割线' };
export const fonts = {system:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",Arial,sans-serif',serif:'"Songti SC","Noto Serif SC",serif',mono:'ui-monospace,SFMono-Regular,Consolas,monospace'};
export const selectors = { body:'p',h1:'h1',h2:'h2',h3:'h3',h4:'h4',h5:'h5',h6:'h6',ol:'ol',ul:'ul',quote:'blockquote',code:'pre',table:'.md-table',image:'figure.md-image',hr:'hr' };
const clamp = (n,min,max,fallback) => Number.isFinite(Number(n)) ? Math.min(max,Math.max(min,Number(n))) : fallback;
export function applySceneSizes(c,scene='web'){
  const size=scene==='app'?17:15;
  const headings=scene==='app'?[19,18,17,17,17,17]:scene==='card'?[17,16,15,15,15,15]:[19,17,15,15,15,15];
  for(const key of ['body','ol','ul'])c[key].size=size;
  headings.forEach((n,i)=>c['h'+(i+1)].size=n);
  c.sizeVersion=1;
  return c;
}
export function applySceneSpacing(c,scene='web'){
  const card=scene==='card',app=scene==='app';
  const divider=card?16:app?18:20, after=card?6:8;
  c.body.before=0;c.body.after=after;
  c.hr={before:divider,after:divider};
  const headingBefore=card?[16,12,8,8,8,8]:app?[18,14,10,10,10,10]:[20,16,12,12,12,12];
  const headingAfter=card?[8,6,4,4,4,4]:[10,8,6,6,6,6];
  for(let i=1;i<=6;i++)Object.assign(c['h'+i],{before:headingBefore[i-1],after:headingAfter[i-1]});
  for(const key of ['ol','ul'])Object.assign(c[key],{before:0,after});
  for(const key of ['quote','image','code','table'])Object.assign(c[key],{before:key==='quote'?10:card?10:12,after:key==='quote'?10:card?10:12});
  c.tightTitles=false;c.spacingVersion=1;
  return c;
}
export function preset(scene='web') {
  const mobile=scene==='app',card=scene==='card';
  const gap=card?16:mobile?12:16, size=mobile?17:15;
  const text=(size,line,weight=400,after=gap,font='system')=>({size,line,unit:'px',weight,color:'#191b1f',font,before:0,after});
  const config={width:card||mobile?390:840,padding:card||mobile?20:30,tightTitles:false,tight:card?4:8,itemGap:4,indent:25,cellPadding:8,columnMin:80,columnMax:card?200:mobile?240:280,colorVersion:1,textColorVersion:1,aiColorVersion:1,ruleColor:'#e8eaed',ruleWidth:1};
  const lineMultiplier=card?1.6:1.7;
  config.body=text(size,lineMultiplier);config.body.unit='multiplier';if(card)config.body.after=6;
  const headingSizes=[size+5,size+3,size+1,size,size,size];
  const headingBefore=[gap,gap-4,gap-6,gap-8,gap-8,gap-8];
  const headingAfter=[config.body.after+2,config.body.after,config.body.after-2,config.body.after-4,config.body.after-4,config.body.after-4];
  for(let i=1;i<=6;i++){const headingSize=headingSizes[i-1];config['h'+i]=text(headingSize,lineMultiplier,i<=4?600:500);config['h'+i].unit='multiplier';config['h'+i].before=Math.max(0,headingBefore[i-1]);config['h'+i].after=Math.max(0,headingAfter[i-1]);}
  config.ol=text(size,lineMultiplier);config.ol.unit='multiplier';config.ul=text(size,lineMultiplier);config.ul.unit='multiplier';config.ol.after=config.body.after;config.ul.after=config.body.after;
  config.quote=text(card||mobile?15:13,card||mobile?24:18,400,10);config.quote.color='#81858f';config.quote.unit='px';config.quote.before=10;config.quote.after=10;
  config.code=text(13,17,400,16,'mono');config.code.before=config.body.after+4;config.code.after=config.body.after+4;
  config.table=text(size,lineMultiplier,400,16);config.table.unit='multiplier';config.table.before=config.body.after+4;config.table.after=config.body.after+4;
  config.thead=text(size,lineMultiplier,600,0);config.thead.unit='multiplier';
  config.image=text(size,card?24:size*1.7,400);config.image.before=config.body.after+4;config.image.after=config.body.after+4;config.image.gap=8;
  config.hr={before:gap,after:gap};
  config.mark={background:'#574cf8',color:'#191b1f',styleVersion:2};
  config.highlight={background:'#574cf8',color:'#191b1f'};
  return applySceneSpacing(applySceneSizes(config,scene),scene);
}
export function normalize(raw,scene) {
  const c=preset(scene);if(!raw||typeof raw!=='object')return c;
  for(const k of Object.keys(labels)) {
    const r=raw[k];if(!r||typeof r!=='object')continue;
    for(const n of ['before','after'])c[k][n]=clamp(r[n],0,160,c[k][n]);
    if(k==='hr')continue;
    c[k].size=clamp(r.size,10,64,c[k].size);
    c[k].unit=r.unit==='multiplier'?'multiplier':'px';
    c[k].line=clamp(r.line,c[k].unit==='px'?10:0.8,c[k].unit==='px'?160:6,c[k].unit==='px'?c[k].line:1.7);
    c[k].weight=clamp(r.weight,100,900,c[k].weight);
    if(/^#[0-9a-f]{6}$/i.test(r.color))c[k].color=r.color;
    if(Object.hasOwn(fonts,r.font))c[k].font=r.font;
  }
  for(const [key,min,max] of [['width',280,1200],['padding',0,80],['tight',0,80],['itemGap',0,80],['indent',0,80],['cellPadding',0,40],['ruleWidth',1,8]])c[key]=clamp(raw[key],min,max,c[key]);
  c.columnMin=clamp(raw.columnMin,40,400,c.columnMin);
  c.columnMax=Math.max(c.columnMin,clamp(raw.columnMax,80,600,c.columnMax));
  c.image.gap=clamp(raw.image?.gap,0,40,c.image.gap);
  c.tightTitles=raw.tightTitles===true;
  if(/^#[0-9a-f]{6}$/i.test(raw.ruleColor))c.ruleColor=raw.ruleColor;
  for(const tag of ['mark','highlight'])for(const key of ['background','color']){
    if(tag==='mark' && raw.mark?.styleVersion!==2)continue;
    if(/^#[0-9a-f]{6}$/i.test(raw[tag]?.[key]))c[tag][key]=raw[tag][key];
  }
  if(raw.colorVersion!==1){
    for(const key of Object.keys(labels))if(key!=='hr')c[key].color=key==='quote'?'#81858f':'#191b1f';
    c.mark.color=c.highlight.color='#191b1f';
    c.ruleColor='#e8eaed';
  }
  // Migrate the previous default text color once, preserving custom colors and layout.
  if(raw.textColorVersion!==1){
    for(const key of Object.keys(labels)){
      if(key!=='hr' && c[key].color.toLowerCase()==='#36393f')c[key].color=key==='quote'?'#81858f':'#191b1f';
    }
    for(const tag of ['mark','highlight'])if(c[tag].color.toLowerCase()==='#36393f')c[tag].color='#191b1f';
  }
  if(raw.aiColorVersion!==1)c.mark.background=c.highlight.background='#574cf8';
  if(raw.rhythm==='css-20261014')c.rhythm=raw.rhythm;
  if(raw.sizeVersion!==1)applySceneSizes(c,scene);
  if(raw.spacingVersion!==1)applySceneSpacing(c,scene);
  return c;
}
export function cssTemplate(base=preset('app'),scene='app'){
  const c=normalize(base,'app');
  c.rhythm='css-20261014';c.tightTitles=false;
  const specs={body:[17,1.7,'multiplier',0,8],h1:[22,1.7,'multiplier',18,10],h2:[20,1.7,'multiplier',14,8],h3:[18,1.7,'multiplier',12,6],h4:[17,1.7,'multiplier',10,4],h5:[17,1.7,'multiplier',10,4],h6:[17,1.7,'multiplier',10,4],ol:[17,1.7,'multiplier',0,8],ul:[17,1.7,'multiplier',0,8],quote:[15,24,'px',10,10],code:[13,17,'px',12,12],table:[15,1.7,'multiplier',12,12],thead:[15,1.7,'multiplier',0,0],image:[15,25.5,'px',12,12]};
  for(const [key,[size,line,unit,before,after]] of Object.entries(specs))Object.assign(c[key],{size,line,unit,before,after});
  Object.assign(c,{indent:25,itemGap:4,cellPadding:8,columnMin:40,columnMax:240});
  c.image.gap=8;c.hr={before:18,after:18};
  return applySceneSpacing(applySceneSizes(c,scene),scene);
}
export function switchUnit(style,unit) {
  if(style.unit===unit)return {...style};
  return {...style,unit,line:unit==='px'?style.line*style.size:style.line/style.size};
}
export function blockGap(c,previous,next) {
  if(c.tightTitles && /^h[1-6]$/.test(previous) && /^h[1-6]$/.test(next) && +next[1]>+previous[1])return c.tight;
  return Math.max(c[previous].after,c[next].before);
}
export function gapSource(c,previous,next) {
  if(c.tightTitles && /^h[1-6]$/.test(previous) && /^h[1-6]$/.test(next) && +next[1]>+previous[1])return '父子标题间距';
  const name=key=>/^h[1-6]$/.test(key)?key.toUpperCase():({body:'正文',ol:'有序列表',ul:'无序列表',quote:'引用',code:'代码块',table:'表格',image:'图片',hr:'分割线'}[key]);
  const after=c[previous].after,before=c[next].before;
  if(after===before)return `${name(previous)}段后 = ${name(next)}段前`;
  return after>before?`${name(previous)}段后`:`${name(next)}段前`;
}
const colorValue=value=>({'#191b1f':'var(--MapText02A)','#81858f':'var(--MapText05A)','#e8eaed':'var(--MapUIFrame09A)','#f5f7fa':'var(--MapUIFrame10A)','#084289':'var(--MapLink)','#574cf8':'var(--MapAI)'}[value.toLowerCase()]||value);
const typography=s=>`font-family:${fonts[s.font]};font-size:${s.size}px;line-height:${s.line}${s.unit==='px'?'px':''};font-weight:${s.weight};color:${colorValue(s.color)};`;
export function buildCSS(c) {
  const all=Object.values(selectors).join(',');
  let css=`/* AI 回答样式实验室 · 将 Markdown 包裹在 .markdown-body 中。\n * 表格包裹在 .md-table 中。间距=max(上一块段后,下一块段前)，不叠加。\n * 段前/段后以元素盒为基准，不包含字体行框内部留白。 */\n.markdown-body{--MapText02A:#191b1f;--MapText05A:#81858f;--MapUIFrame09A:#e8eaed;--MapUIFrame10A:#f5f7fa;--MapLink:#084289;--MapAI:#574cf8;${typography(c.body)}overflow-wrap:anywhere;display:flow-root;}\n.markdown-body :where(${all}){margin:0;}\n.markdown-body :where(h1,h2,h3,h4,h5,h6){padding:0;}\n`;
  for(const [k,selector] of Object.entries(selectors)) {
    if(k!=='hr')css+=`.markdown-body ${selector}{${typography(c[k])}}\n`;
    css+=`.markdown-body ${selector}{margin-block-start:${c[k].before}px;}\n`;
  }
  for(const [a,sa] of Object.entries(selectors))for(const [b,sb] of Object.entries(selectors))css+=`.markdown-body ${sa} + ${sb}{margin-block-start:${blockGap(c,a,b)}px;}\n`;
  const imageWidth=`calc((100% - ${c.image.gap*2}px) / 3)`;
  css+=`.markdown-body figure.md-image{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:${c.image.gap}px;width:min(100%, 440px);max-width:440px;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}\n.markdown-body figure.md-image img{display:block;flex:0 0 ${imageWidth};width:${imageWidth};aspect-ratio:1 / 1;height:auto;max-width:none;margin:0;border-radius:4px;object-fit:cover;}\n.markdown-body li > figure.md-image{width:min(100%, 440px);max-width:440px;margin-inline:0;padding-inline:0;}\n`;
  css+=`.markdown-body .md-table > table{min-width:100%;}\n`;
  css+=`.markdown-body > :first-child,.markdown-body :where(li,blockquote) > :first-child{margin-block-start:0;}\n.markdown-body :where(ol,ul){padding-inline-start:${c.indent}px;}\n.markdown-body li + li{margin-block-start:${c.itemGap}px;}\n.markdown-body li > p,.markdown-body blockquote > p{font:inherit;color:inherit;}\n.markdown-body li > :last-child,.markdown-body blockquote > :last-child{margin-block-end:0;}\n.markdown-body blockquote{border-left:3px solid var(--MapUIFrame09A);padding:2px 0 2px 16px;display:flow-root;}\n.markdown-body pre{padding:16px;background:var(--MapUIFrame10A);border:1px solid var(--MapUIFrame09A);border-radius:8px;overflow:auto;white-space:pre;overflow-wrap:normal;}\n.markdown-body pre code{font:inherit;color:inherit;background:none;padding:0;}\n.markdown-body :not(pre) > code{font-family:${fonts.mono};font-size:.9em;background:var(--MapUIFrame10A);border-radius:4px;padding:2px 5px;}\n.markdown-body .md-table{width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;border:1px solid var(--MapUIFrame09A);border-radius:8px;}\n.markdown-body table{width:max-content;table-layout:auto;border-collapse:collapse;font:inherit;color:inherit;}\n.markdown-body td,.markdown-body th{padding:${c.cellPadding}px;white-space:normal;border-bottom:1px solid var(--MapUIFrame09A);border-right:1px solid var(--MapUIFrame09A);vertical-align:top;text-align:left;}\n.markdown-body td{${typography(c.table)}}\n.markdown-body th{${typography(c.thead)}background:var(--MapUIFrame10A);}\n.markdown-body tr > :last-child{border-right:0;}\n.markdown-body tbody tr:last-child td{border-bottom:0;}\n.markdown-body hr{border:0;height:${c.ruleWidth}px;background:${colorValue(c.ruleColor)};padding:0;}\n.markdown-body a{color:var(--MapLink);text-decoration:none;}\n.markdown-body a:hover{text-decoration:underline;}\n.markdown-body strong{font-weight:700;}\n.markdown-body img{max-width:100%;height:auto;}\n.markdown-body input[type=checkbox]{margin-inline-end:6px;}\n`;
  const markBackground=`color-mix(in srgb, ${colorValue(c.mark.background)} 20%, transparent)`,highlightBackground=`color-mix(in srgb, ${colorValue(c.highlight.background)} 10%, transparent)`;
  css+=`.markdown-body mark{background-color:transparent;background-image:linear-gradient(${markBackground},${markBackground});background-repeat:no-repeat;background-position:0 95%;background-size:100% .5em;color:${colorValue(c.mark.color)};font-weight:700;padding:0;border-radius:0;-webkit-box-decoration-break:clone;box-decoration-break:clone;}\n.markdown-body highlight{display:inline;background-color:${highlightBackground};color:${colorValue(c.highlight.color)};font-weight:inherit;padding:.06em .04em;border-radius:0;-webkit-box-decoration-break:clone;box-decoration-break:clone;}\n`;
  css+=`.markdown-body .md-cell{box-sizing:content-box;width:max-content;min-width:${c.columnMin}px;max-width:${Math.max(c.columnMin,c.columnMax)}px;white-space:normal;overflow-wrap:anywhere;word-break:normal;}\n`;
  return css;
}
export function buildLegacyCSS(scene='web') {
  const card=scene==='card', app=scene==='app';
  const size=card?15:app?17:15, line=card?'24px':'27px', color=card?'#242a33':'#5f6b80', gap=card?8:app?12:16;
  return `.legacy-layer{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",Arial,sans-serif!important;font-size:${size}px!important;line-height:${line}!important;color:${color}!important;} .legacy-layer p{margin:0 0 ${gap}px!important;} .legacy-layer h1,.legacy-layer h2{font-size:${card?16:18}px!important;line-height:${line}!important;font-weight:${card?600:700}!important;margin:0 0 ${gap}px!important;} .legacy-layer h3{font-size:${card?15:app?17:16}px!important;line-height:${line}!important;font-weight:700!important;margin:0 0 ${gap}px!important;} .legacy-layer h4,.legacy-layer h5,.legacy-layer h6{font-size:${card?15:app?17:16}px!important;line-height:${line}!important;font-weight:500!important;margin:0 0 ${gap}px!important;} .legacy-layer :where(ol,ul){padding-inline-start:25px!important;margin:0 0 ${gap}px!important;} .legacy-layer li{margin-top:4px!important;} .legacy-layer li:first-child{margin-top:0!important;} .legacy-layer blockquote{margin:0 0 ${gap}px!important;padding-left:16px!important;border-left:3px solid #e2e5eb!important;color:inherit!important;} .legacy-layer pre,.legacy-layer .md-table,.legacy-layer figure.md-image{margin:0 0 16px!important;} .legacy-layer pre{font-size:13px!important;line-height:17px!important;} .legacy-layer .md-table{overflow:auto!important;} .legacy-layer hr{margin:0 0 ${gap}px!important;border:0!important;height:1px!important;background:#e2e5eb!important;}`;
}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(href) {
  // Only explicit HTTP(S), mailto and fragment links; reject encoded schemes.
  if(!/^(https?:\/\/|mailto:|#)/i.test(href))return '';
  return escapeHTML(href);
}
const imageTags=html=>String(html).match(/<img\b[^>]*>/gi)||[];
const imageGroups=images=>{const groups=[];for(let i=0;i<images.length;i+=3){const chunk=images.slice(i,i+3);groups.push(`<figure class="md-image${chunk.length>1?' md-image-group':''}">${chunk.join('')}</figure>`);}return groups.join('');};
const wrapListImageRows=html=>html.replace(/(^|\n)[ \t]*((?:<img\b[^>]*>[ \t]*(?:\n[ \t]*)?)+)/g,(match,prefix,images)=>`${prefix}${imageGroups(imageTags(images))}`);
const parser=new Marked({gfm:true,breaks:false,renderer:{
  html({text}){
    // Allow only the inert mark element; never forward user-supplied attributes.
    const mark=text.match(/^<(\/?)(mark|highlight)(?:\s[^<>]*)?>$/i);
    // A mark on its own line is tokenized as an HTML block by GFM.
    // Re-tokenize that block inline so emphasis works and every tag still
    // passes through this attribute-stripping / escaping renderer.
    if(!mark && /^<(?:mark|highlight)(?:\s[^<>]*)?>/i.test(text))return parser.parseInline(text);
    return mark?`<${mark[1]}${mark[2].toLowerCase()}>`:escapeHTML(text);
  },
  link({href,tokens}){const label=this.parser.parseInline(tokens);const url=safeURL(href);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`:label;},
  listitem(item){return `<li>${wrapListImageRows(this.parser.parse(item.tokens))}</li>\n`;},
  paragraph({tokens}){const text=this.parser.parseInline(tokens);const value=String(text||'').trim();const images=imageTags(value);if(images.length && value.replace(/<img\b[^>]*>/gi,'').trim()==='')return imageGroups(images);return `<p>${text}</p>`;},
  image({href,text,title}){const url=safeURL(href);if(!url)return `[图片：${escapeHTML(text)}]`;const label=escapeHTML(text||'');const titleAttr=title?` title="${escapeHTML(title)}"`:'';return `<img src="${url}" alt="${label}" loading="lazy" decoding="async"${titleAttr}>`;},
  table(token){let header='',body='';const renderCell=cell=>this.tablecell(cell).replace(/^(<(?:th|td)[^>]*>)([\s\S]*)(<\/(?:th|td)>)/, '$1<div class="md-cell">$2</div>$3');for(const cell of token.header)header+=renderCell(cell);for(const row of token.rows){let cells='';for(const cell of row)cells+=renderCell(cell);body+=`<tr>${cells}</tr>`;}return `<div class="md-table" tabindex="0" role="region" aria-label="表格，可左右滚动"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;}
}});
export function renderMarkdown(source){let html=parser.parse(source);return html.replace(/(?:<figure class="md-image(?: md-image-group)?">[\s\S]*?<\/figure>\s*)+/g,match=>imageGroups(imageTags(match)));}
export const sample="# 一、让回答更容易阅读\n\n好的回答应该让读者快速找到结论，也能舒适地阅读细节。这是一段普通正文，用来观察字体、字号、字重和字色是否合适。文字不应过于沉重，也不应显得发灰。\n\n这是第二段正文，用来检查相邻段落之间的距离。你可以比较中文、English、数字 0123456789，以及标点：，。！？；：“”【】（）的显示效果。\n\n**这是加粗文字，用来突出核心结论。** 普通正文与加粗内容应当有清晰区别，但不应产生突兀的视觉跳跃。\n\n## 二、检查标题与正文的关系\n\n二级标题负责划分主要内容。标题下方的正文应当与它形成一个整体，同时与上一段内容保持适当距离。\n\n### 1. 三级标题：说明具体问题\n\n三级标题应当比正文更容易识别，但不需要过分醒目。请观察标题与正文的字重差异，以及多行标题的行高。\n\n#### 四级标题：补充细节\n\n这段正文属于四级标题，检查层级变深后是否仍然容易阅读。\n\n##### 五级标题：进一步说明\n\n低级标题可能主要依靠字重表达层级，检查它是否会与正文中的加粗文字混淆。\n\n###### 六级标题：最细的说明\n\n这是最深一级标题下的正文。即使字号接近正文，仍应能识别它的组织作用。\n\n## 三、检查列表的阅读节奏\n\n### 有序列表\n\n1. **先看结论**：第一项包含加粗文字和普通文字，检查强调是否自然。\n2. **再看依据**：这是一条较长的列表内容，用来检查换行后文字是否与首行内容对齐，以及列表项之间是否保留了足够的空间，让读者不会把相邻两项误读为同一段。\n3. **最后看行动**：结合自己的时间、预算和实际需求，确定下一步。\n   - 补充说明一：检查嵌套列表的缩进。\n   - 补充说明二：检查圆点与文字的距离。\n\n### 无序列表\n\n- 普通列表项，观察圆点大小与文字的位置。\n- **带加粗内容的列表项**，观察它是否过于抢眼。\n- 包含 English、89㎡、18万元、10%–20% 的列表项。\n- 这是一条较长的无序列表内容，用来观察窄屏场景下的换行效果。换行后应保持清晰的左侧对齐，列表整体也不应显得过于拥挤。\n\n## 四、检查引用文字的灰度\n\n> 这是一段引用。引用应当与正文有明确区别，同时保持足够的可读性。请观察它是否太浅、字号是否偏小，以及左侧竖线与文字的距离是否合适。\n\n引用结束后，正文应当自然恢复到正常的字色与字号。\n\n> 这是一段较长的引用，用来检查多行文字在浅色背景上的阅读体验。如果需要仔细辨认才能读清楚，说明引用的灰度、字号或行高需要进一步调整。\n>\n> **引用里的加粗文字**仍然属于引用，应当保留引用字色，只通过字重表达强调。\n>\n> 第二段引用用于检查引用内部的段落关系。\n\n## 五、检查高亮与底部标记\n\n普通文字，<highlight>这是一段整块高亮内容</highlight>，高亮结束后继续普通文字。\n\n<highlight>这是一段需要跨行显示的高亮文字。它包含较长的解释内容，用来观察换行后每一行的底色是否连续、文字是否清楚，以及高亮背景与普通正文之间的关系是否自然。**这里还有一段加粗内容。**</highlight>\n\n普通文字，<mark>这是加粗并带有底部标记的关键结论</mark>，标记结束后继续普通文字。\n\n<mark>这是一段需要跨行显示的底部标记内容。请观察每一行底部的紫色标记是否处于合适的位置，是否遮挡文字，以及较长的加粗句子会不会让整段回答显得过于沉重。</mark>\n\n**普通加粗**、<highlight>整块高亮</highlight>、<mark>底部标记</mark>放在一起时，应当能分辨出三种强调方式。\n\n## 六、检查表格\n\n| 方案 | 核心特点 | 适用情况 | 预算范围 | 时间投入 | 注意事项 |\n| --- | --- | --- | --- | --- | --- |\n| **方案 A** | 简洁直接 | 需求明确 | 5万–8万元 | 较少 | 检查短文本的列宽 |\n| **方案 B** | 兼顾灵活性与效率 | 希望自主调整细节 | 8万–12万元 | 中等 | 这是一段较长的单元格内容，用来检查自动换行、单元格内边距，以及表格正文的字号和行高 |\n| **方案 C** | 个性化程度较高 | 对最终效果有明确要求 | 12万–18万元 | 较多 | 检查窄屏下是否可以顺畅左右滚动 |\n| Mixed 内容 | English / 中文 / 2026 | 多种内容混排 | ¥123,456.78 | 10–20天 | **加粗文字**与普通文字的对比 |\n\n表格后的正文应当与表格保持适当距离，同时恢复正常的正文样式。\n\n## 七、检查链接与代码\n\n这是一段包含[示例链接](https://example.com)的正文。链接应该容易识别，但不应比标题和关键结论更抢眼。\n\n行内代码示例：`font-weight: 600`、`MapText02A`、`0123456789`。请检查它们与中文正文混排时的大小和基线。\n\n```javascript\nconst typography = {\n  bodyColor: \"#191B1F\",\n  quoteColor: \"#81858F\",\n  fontWeight: 400\n};\n\nconsole.log(\"中文、English、数字 0123456789\");\nconst longLine = \"这是一行较长的代码，用来检查代码块在窄屏下的横向滚动，以及等宽字体的显示效果。\";\n```\n\n代码块之后的正文应当恢复正常字体，且与代码块之间保持清晰的间距。\n\n## 八、检查图片与文字的关系\n\n### 单张图片\n\n检查图片与前后正文的距离、缩略图的裁切和圆角，以及不同场景下的图片宽度。\n\n![单张图片测试](https://pic1.zhimg.com/v2-d69314a606fe3c7a4541c396a73f9a84.png)\n\n图片后的正文应当恢复正常的阅读节奏。\n\n### 三张图片排列\n\n使用同一张图片测试三列排列，检查图片之间的间隙、等宽效果和窄屏下的显示。\n\n![三图排列一](https://pic1.zhimg.com/v2-d69314a606fe3c7a4541c396a73f9a84.png) ![三图排列二](https://pic1.zhimg.com/v2-d69314a606fe3c7a4541c396a73f9a84.png) ![三图排列三](https://pic1.zhimg.com/v2-d69314a606fe3c7a4541c396a73f9a84.png)\n\n### 列表中的图片\n\n- **图片与列表文字对齐**：检查缩略图左侧是否与列表内容对齐。\n  ![列表图片测试](https://pic1.zhimg.com/v2-d69314a606fe3c7a4541c396a73f9a84.png)\n- 图片之后的列表项，检查列表项间距是否自然。\n\n---\n\n## 九、最后检查整体感受\n\n快速浏览页面时，标题是否容易找到？连续阅读时，正文是否舒适？引用是否清晰？高亮是否适量？表格、代码和图片是否挤占了太多注意力？\n\n- [ ] 标题层级清楚，正文阅读舒适。\n- [ ] 引用清晰，高亮和底部标记容易区分。\n- [ ] 表格与代码在窄屏下可以正常查看。\n- [ ] 图片排列整齐，与前后文字的距离合适。\n\n**理想的效果是：层级清楚，重点明确，长时间阅读也不会觉得拥挤或疲劳。**";
