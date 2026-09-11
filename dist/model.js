import { Marked } from './vendor/marked.js';

export const labels = { body:'正文', h1:'H1 · 一级标题', h2:'H2 · 二级标题', h3:'H3 · 三级标题', h4:'H4 · 四级标题', h5:'H5 · 五级标题', h6:'H6 · 六级标题', ol:'有序列表', ul:'无序列表', quote:'引用', code:'代码块', table:'表格正文', thead:'表格表头', image:'图片', hr:'分割线' };
export const fonts = {system:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",Arial,sans-serif',serif:'"Songti SC","Noto Serif SC",serif',mono:'ui-monospace,SFMono-Regular,Consolas,monospace'};
export const selectors = { body:'p',h1:'h1',h2:'h2',h3:'h3',h4:'h4',h5:'h5',h6:'h6',ol:'ol',ul:'ul',quote:'blockquote',code:'pre',table:'.md-table',image:'figure.md-image',hr:'hr' };
const clamp = (n,min,max,fallback) => Number.isFinite(Number(n)) ? Math.min(max,Math.max(min,Number(n))) : fallback;
export function preset(scene='web') {
  const mobile=scene==='app',card=scene==='card';
  const gap=card?16:mobile?12:16, size=mobile?17:15;
  const text=(size,line,weight=400,after=gap,font='system')=>({size,line,unit:'px',weight,color:'#242a33',font,before:0,after});
  const config={width:card||mobile?390:840,padding:card||mobile?20:30,tightTitles:false,tight:card?4:8,itemGap:4,indent:25,cellPadding:8,columnMin:80,columnMax:card?200:mobile?240:280,ruleColor:'#e2e5eb',ruleWidth:1};
  const lineMultiplier=card?1.6:1.7;
  config.body=text(size,lineMultiplier);config.body.unit='multiplier';if(card)config.body.after=6;
  const headingSizes=[size+5,size+3,size+1,size,size,size];
  const headingBefore=[gap,gap-4,gap-6,gap-8,gap-8,gap-8];
  const headingAfter=[config.body.after+2,config.body.after,config.body.after-2,config.body.after-4,config.body.after-4,config.body.after-4];
  for(let i=1;i<=6;i++){const headingSize=headingSizes[i-1];config['h'+i]=text(headingSize,lineMultiplier,i<=4?600:500);config['h'+i].unit='multiplier';config['h'+i].before=Math.max(0,headingBefore[i-1]);config['h'+i].after=Math.max(0,headingAfter[i-1]);}
  config.ol=text(size,lineMultiplier);config.ol.unit='multiplier';config.ul=text(size,lineMultiplier);config.ul.unit='multiplier';config.ol.after=config.body.after;config.ul.after=config.body.after;
  config.quote=text(card||mobile?15:13,card||mobile?24:18,400,10);config.quote.color='#657084';config.quote.unit='px';config.quote.before=10;config.quote.after=10;
  config.code=text(13,17,400,16,'mono');config.code.before=config.body.after+4;config.code.after=config.body.after+4;
  config.table=text(size,lineMultiplier,400,16);config.table.unit='multiplier';config.table.before=config.body.after+4;config.table.after=config.body.after+4;
  config.thead=text(size,lineMultiplier,600,0);config.thead.unit='multiplier';
  config.image=text(size,card?24:size*1.7,400);config.image.before=config.body.after+4;config.image.after=config.body.after+4;
  config.hr={before:gap,after:gap};
  config.mark={background:'#dcd7ff',color:'#37383c',styleVersion:2};
  config.highlight={background:'#efecff',color:'#37383c'};
  return config;
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
  c.tightTitles=raw.tightTitles===true;
  if(/^#[0-9a-f]{6}$/i.test(raw.ruleColor))c.ruleColor=raw.ruleColor;
  for(const tag of ['mark','highlight'])for(const key of ['background','color']){
    if(tag==='mark' && raw.mark?.styleVersion!==2)continue;
    if(/^#[0-9a-f]{6}$/i.test(raw[tag]?.[key]))c[tag][key]=raw[tag][key];
  }
  return c;
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
const typography=s=>`font-family:${fonts[s.font]};font-size:${s.size}px;line-height:${s.line}${s.unit==='px'?'px':''};font-weight:${s.weight};color:${s.color};`;
export function buildCSS(c) {
  const all=Object.values(selectors).join(',');
  let css=`/* AI 回答样式实验室 · 将 Markdown 包裹在 .markdown-body 中。\n * 表格包裹在 .md-table 中。间距=max(上一块段后,下一块段前)，不叠加。\n * 段前/段后以元素盒为基准，不包含字体行框内部留白。 */\n.markdown-body{${typography(c.body)}overflow-wrap:anywhere;display:flow-root;}\n.markdown-body :where(${all}){margin:0;}\n.markdown-body :where(h1,h2,h3,h4,h5,h6){padding:0;}\n`;
  for(const [k,selector] of Object.entries(selectors)) {
    if(k!=='hr')css+=`.markdown-body ${selector}{${typography(c[k])}}\n`;
    css+=`.markdown-body ${selector}{margin-block-start:${c[k].before}px;}\n`;
  }
  for(const [a,sa] of Object.entries(selectors))for(const [b,sb] of Object.entries(selectors))css+=`.markdown-body ${sa} + ${sb}{margin-block-start:${blockGap(c,a,b)}px;}\n`;
  css+=`.markdown-body figure.md-image{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:8px;width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}\n.markdown-body figure.md-image img{display:block;flex:0 0 98px;width:98px;height:98px;max-width:none;margin:0;border-radius:8px;object-fit:cover;}\n.markdown-body li > figure.md-image{width:100%;max-width:100%;margin-inline:0;padding-inline:0;}\n`;
  css+=`.markdown-body .md-table > table{min-width:100%;}\n`;
  css+=`.markdown-body > :first-child,.markdown-body :where(li,blockquote) > :first-child{margin-block-start:0;}\n.markdown-body :where(ol,ul){padding-inline-start:${c.indent}px;}\n.markdown-body li + li{margin-block-start:${c.itemGap}px;}\n.markdown-body li > p,.markdown-body blockquote > p{font:inherit;color:inherit;}\n.markdown-body li > :last-child,.markdown-body blockquote > :last-child{margin-block-end:0;}\n.markdown-body blockquote{border-left:3px solid #dce1e9;padding:2px 0 2px 16px;display:flow-root;}\n.markdown-body pre{padding:16px;background:#f6f7f9;border:1px solid #e6e9ee;border-radius:8px;overflow:auto;white-space:pre;overflow-wrap:normal;}\n.markdown-body pre code{font:inherit;color:inherit;background:none;padding:0;}\n.markdown-body :not(pre) > code{font-family:${fonts.mono};font-size:.9em;background:#f1f3f6;border-radius:4px;padding:2px 5px;}\n.markdown-body .md-table{width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;border:1px solid #e3e7ed;border-radius:8px;}\n.markdown-body table{width:max-content;table-layout:auto;border-collapse:collapse;font:inherit;color:inherit;}\n.markdown-body td,.markdown-body th{padding:${c.cellPadding}px;white-space:normal;border-bottom:1px solid #e3e7ed;border-right:1px solid #e3e7ed;vertical-align:top;text-align:left;}\n.markdown-body td{${typography(c.table)}}\n.markdown-body th{${typography(c.thead)}background:#f5f7fa;}\n.markdown-body tr > :last-child{border-right:0;}\n.markdown-body tbody tr:last-child td{border-bottom:0;}\n.markdown-body hr{border:0;height:${c.ruleWidth}px;background:${c.ruleColor};padding:0;}\n.markdown-body a{color:#2168ee;text-decoration:none;}\n.markdown-body a:hover{text-decoration:underline;}\n.markdown-body strong{font-weight:700;}\n.markdown-body img{max-width:100%;height:auto;}\n.markdown-body input[type=checkbox]{margin-inline-end:6px;}\n`;
  css+=`.markdown-body mark{background-color:transparent;background-image:linear-gradient(${c.mark.background},${c.mark.background});background-repeat:no-repeat;background-position:0 95%;background-size:100% .5em;color:${c.mark.color};font-weight:700;padding:0;border-radius:0;-webkit-box-decoration-break:clone;box-decoration-break:clone;}\n.markdown-body highlight{display:inline;background-color:${c.highlight.background};color:${c.highlight.color};font-weight:inherit;padding:.06em .04em;border-radius:0;-webkit-box-decoration-break:clone;box-decoration-break:clone;}\n`;
  css+=`.markdown-body .md-cell{box-sizing:content-box;width:max-content;min-width:${c.columnMin}px;max-width:${Math.max(c.columnMin,c.columnMax)}px;white-space:normal;overflow-wrap:anywhere;word-break:normal;}\n`;
  return css;
}
export function buildLegacyCSS(scene='web') {
  const card=scene==='card', app=scene==='app';
  const size=card?15:app?17:15, line=card?'24px':'27px', color=card?'#242a33':'#5f6b80', gap=card?8:app?12:16;
  return `.legacy-layer{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",Arial,sans-serif!important;font-size:${size}px!important;line-height:${line}!important;color:${color}!important;} .legacy-layer p{margin:0 0 ${gap}px!important;} .legacy-layer h1,.legacy-layer h2{font-size:${card?16:18}px!important;line-height:${line}!important;font-weight:${card?600:700}!important;margin:0 0 ${gap}px!important;} .legacy-layer h3{font-size:${card?15:app?17:16}px!important;line-height:${line}!important;font-weight:700!important;margin:0 0 ${gap}px!important;} .legacy-layer h4,.legacy-layer h5,.legacy-layer h6{font-size:${card?15:app?17:16}px!important;line-height:${line}!important;font-weight:500!important;margin:0 0 ${gap}px!important;} .legacy-layer :where(ol,ul){padding-inline-start:25px!important;margin:0 0 ${gap}px!important;} .legacy-layer li{margin-top:4px!important;} .legacy-layer li:first-child{margin-top:0!important;} .legacy-layer blockquote{margin:0 0 ${gap}px!important;padding-left:16px!important;border-left:3px solid #e2e5eb!important;color:inherit!important;} .legacy-layer pre,.legacy-layer .md-table,.legacy-layer figure.md-image{margin:0 0 16px!important;} .legacy-layer pre{font-size:13px!important;line-height:17px!important;} .legacy-layer .md-table{overflow:auto!important;} .legacy-layer img{max-width:100%!important;height:auto!important;border-radius:8px!important;} .legacy-layer hr{margin:0 0 ${gap}px!important;border:0!important;height:1px!important;background:#e2e5eb!important;}`;
}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(href) {
  // Only explicit HTTP(S), mailto and fragment links; reject encoded schemes.
  if(!/^(https?:\/\/|mailto:|#)/i.test(href))return '';
  return escapeHTML(href);
}
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
  paragraph({tokens}){const text=this.parser.parseInline(tokens);const value=String(text||'').trim();const images=value.match(/<img\b[^>]*>/gi)||[];if(images.length && value.replace(/<img\b[^>]*>/gi,'').trim()==='')return `<figure class="md-image${images.length>1?' md-image-group':''}">${images.join('')}</figure>`;return `<p>${text}</p>`;},
  image({href,text,title}){const url=safeURL(href);if(!url)return `[图片：${escapeHTML(text)}]`;const label=escapeHTML(text||'');const titleAttr=title?` title="${escapeHTML(title)}"`:'';return `<img src="${url}" alt="${label}" loading="lazy" decoding="async"${titleAttr}>`;},
  table(token){let header='',body='';const renderCell=cell=>this.tablecell(cell).replace(/^(<(?:th|td)[^>]*>)([\s\S]*)(<\/(?:th|td)>)/, '$1<div class="md-cell">$2</div>$3');for(const cell of token.header)header+=renderCell(cell);for(const row of token.rows){let cells='';for(const cell of row)cells+=renderCell(cell);body+=`<tr>${cells}</tr>`;}return `<div class="md-table" tabindex="0" role="region" aria-label="表格，可左右滚动"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;}
}});
export function renderMarkdown(source){let html=parser.parse(source),previous='';while(previous!==html){previous=html;html=html.replace(/<figure class="md-image(?: md-image-group)?">([\s\S]*?)<\/figure>\s*<figure class="md-image(?: md-image-group)?">([\s\S]*?)<\/figure>/g,'<figure class="md-image md-image-group">$1$2</figure>');}return html;}
export const sample=`# 如何让 AI 回答更容易阅读？

好的排版不仅是文字整齐，更要让读者一眼看懂**哪些内容属于同一组**。在这里，你可以边修改 Markdown，边调试回答的字号、行高和模块间距。

<mark>结合你的89㎡两居室需求，最推荐优先比较**半包＋独立设计师**组合方案，并为18万元总预算保留应急空间。</mark> <highlight>高亮强调：这是可独立调色的整块高亮。</highlight>

## 先建立清晰的阅读层级

### 标题与正文，应该有怎样的距离？

标题负责概括，正文负责解释。标题与所属内容应当靠近，而上一个模块与新标题之间可以适当留白。

试着将正文行高设为 **28 px**，或切换成 **1.7 倍**，观察多行文字的阅读节奏。切换单位时，工具会根据当前字号进行等效换算。

### 用结构表达信息，而不是堆叠空行

1. **先确定阅读场景**：Web 适合完整阅读，App 需要兼顾屏幕宽度。
2. **再检查内容关系**：父子标题、标题与正文、同级模块，应该有不同的节奏。
3. **最后调整特殊内容块**：引用、代码和表格，也要放进同一套间距体系。
   - 列表内部保持紧凑。
   - 嵌套内容不应重复增加外部间距。

> 分组越清楚，读者越容易扫描内容。
>
> 不一定需要更大的空白，也可以通过字号、字重与边界建立层级。

## 对比不同阅读场景

| 场景 | 正文字号 | 正文行高 | 普通块间距 |
| :--- | ---: | ---: | ---: |
| Web AI 搜索 | 15 px | 25.5 px | 16 px |
| App AI 搜索 | 17 px | 28.9 px | 12 px |
| App 搜索卡片 | 15 px | 24 px | 8 px |

表格的**表头与正文**可独立设置字号、行高、字重、字体和颜色，表格外部间距与单元格内部留白也可以分别调整。

---

## 一个简单的实现原则

~~~css
/* 相邻内容只保留一个有效间距 */
.markdown-body p + h3 {
  margin-top: 24px;
}

.markdown-body h2 + h3 {
  margin-top: 8px;
}
~~~

将 \`段前\` 和 \`段后\` 放在同一套控件中，比较起来会更直观。分割线的上下空白也需要明确设置。

#### 局部说明 H4

更细的信息可以用小标题，或直接用加粗引导语。

##### 补充信息 H5

支持查看低层级标题的实际效果。

###### 备注 H6

标题层级只是结构，不必每次回答都用满六级。

- [x] 检查正文和标题的行高
- [x] 检查表头与表格正文
- [ ] 对照真实回答调整参数

**提示：** 支持 highlight 整块高亮和 mark 底部标记，以及其中的加粗、斜体；图片会按 Markdown 图片语法直接渲染，并限制在内容宽度内。下方 CSS 样式预览区可查看、复制当前场景的完整样式。
`;
