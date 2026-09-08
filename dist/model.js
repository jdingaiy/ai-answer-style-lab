import { Marked } from './vendor/marked.js';

export const labels = { body:'正文', h1:'H1 · 一级标题', h2:'H2 · 二级标题', h3:'H3 · 三级标题', h4:'H4 · 四级标题', h5:'H5 · 五级标题', h6:'H6 · 六级标题', ol:'有序列表', ul:'无序列表', quote:'引用', code:'代码块', table:'表格正文', thead:'表格表头', hr:'分割线' };
export const fonts = {system:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",Arial,sans-serif',serif:'"Songti SC","Noto Serif SC",serif',mono:'ui-monospace,SFMono-Regular,Consolas,monospace'};
export const selectors = { body:'p',h1:'h1',h2:'h2',h3:'h3',h4:'h4',h5:'h5',h6:'h6',ol:'ol',ul:'ul',quote:'blockquote',code:'pre',table:'.md-table',hr:'hr' };
const clamp = (n,min,max,fallback) => Number.isFinite(Number(n)) ? Math.min(max,Math.max(min,Number(n))) : fallback;
export function preset(scene='web') {
  const mobile=scene==='app',card=scene==='card';
  const gap=card?8:mobile?12:16, size=mobile?17:15;
  const text=(size,line,weight=400,after=gap,font='system')=>({size,line,unit:'px',weight,color:'#242a33',font,before:0,after});
  const config={width:card||mobile?390:840,padding:card||mobile?20:30,tightTitles:false,tight:card?4:8,itemGap:4,indent:25,cellPadding:8,ruleColor:'#e2e5eb',ruleWidth:1};
  config.body=text(size,card?24:size*1.7);
  for(let i=1;i<=6;i++)config['h'+i]=text(card?(i<=2?16:15):(i<=2?18:mobile?17:16),card?(i<=2?25.6:24):27,i===1||i===3?700:500);
  config.ol=text(size,card?24:size*1.7);config.ul=text(size,card?24:size*1.7);
  config.quote=text(size,card?24:size*1.7);config.quote.color='#657084';
  config.code=text(13,17,400,16,'mono');
  config.table=text(size,card?24:size*1.7,400,16);
  config.thead=text(size,card?24:size*1.7,600,0);
  config.hr={before:gap,after:gap};
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
  for(const [key,min,max] of [['width',280,1200],['padding',0,80],['tight',0,80],['itemGap',0,80],['indent',16,80],['cellPadding',0,40],['ruleWidth',1,8]])c[key]=clamp(raw[key],min,max,c[key]);
  c.tightTitles=raw.tightTitles===true;
  if(/^#[0-9a-f]{6}$/i.test(raw.ruleColor))c.ruleColor=raw.ruleColor;
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
const typography=s=>`font-family:${fonts[s.font]};font-size:${s.size}px;line-height:${s.line}${s.unit==='px'?'px':''};font-weight:${s.weight};color:${s.color};`;
export function buildCSS(c) {
  const all=Object.values(selectors).join(',');
  let css=`/* AI 回答样式实验室 · 将 Markdown 包裹在 .answer 中。\n * 表格包裹在 .md-table 中。间距=max(上一块段后,下一块段前)，不叠加。\n * 段前/段后以元素盒为基准，不包含字体行框内部留白。 */\n.answer{${typography(c.body)}overflow-wrap:anywhere;display:flow-root;}\n.answer :where(${all}){margin:0;}\n.answer :where(h1,h2,h3,h4,h5,h6){padding:0;}\n`;
  for(const [k,selector] of Object.entries(selectors)) {
    if(k!=='hr')css+=`.answer ${selector}{${typography(c[k])}}\n`;
    css+=`.answer ${selector}{margin-block-start:${c[k].before}px;}\n`;
  }
  for(const [a,sa] of Object.entries(selectors))for(const [b,sb] of Object.entries(selectors))css+=`.answer ${sa} + ${sb}{margin-block-start:${blockGap(c,a,b)}px;}\n`;
  css+=`.answer > :first-child,.answer :where(li,blockquote) > :first-child{margin-block-start:0;}\n.answer :where(ol,ul){padding-inline-start:${c.indent}px;}\n.answer li + li{margin-block-start:${c.itemGap}px;}\n.answer li > p,.answer blockquote > p{font:inherit;color:inherit;}\n.answer li > :last-child,.answer blockquote > :last-child{margin-block-end:0;}\n.answer blockquote{border-left:3px solid #dce1e9;padding:2px 0 2px 16px;display:flow-root;}\n.answer pre{padding:16px;background:#f6f7f9;border:1px solid #e6e9ee;border-radius:8px;overflow:auto;white-space:pre;overflow-wrap:normal;}\n.answer pre code{font:inherit;color:inherit;background:none;padding:0;}\n.answer :not(pre) > code{font-family:${fonts.mono};font-size:.9em;background:#f1f3f6;border-radius:4px;padding:2px 5px;}\n.answer .md-table{overflow-x:auto;border:1px solid #e3e7ed;border-radius:8px;}\n.answer table{width:100%;border-collapse:collapse;font:inherit;color:inherit;}\n.answer td,.answer th{padding:${c.cellPadding}px;min-width:80px;border-bottom:1px solid #e3e7ed;border-right:1px solid #e3e7ed;vertical-align:top;text-align:left;}\n.answer td{${typography(c.table)}}\n.answer th{${typography(c.thead)}background:#f5f7fa;}\n.answer tr > :last-child{border-right:0;}\n.answer tbody tr:last-child td{border-bottom:0;}\n.answer hr{border:0;height:${c.ruleWidth}px;background:${c.ruleColor};padding:0;}\n.answer a{color:#2168ee;text-decoration:none;}\n.answer a:hover{text-decoration:underline;}\n.answer strong{font-weight:700;}\n.answer img{max-width:100%;height:auto;}\n.answer input[type=checkbox]{margin-inline-end:6px;}\n`;
  return css;
}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(href) {
  // Only explicit HTTP(S), mailto and fragment links; reject encoded schemes.
  if(!/^(https?:\/\/|mailto:|#)/i.test(href))return '';
  return escapeHTML(href);
}
const parser=new Marked({gfm:true,breaks:false,renderer:{
  html({text}){return escapeHTML(text);},
  link({href,tokens}){const label=this.parser.parseInline(tokens);const url=safeURL(href);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`:label;},
  image({href,text}){const url=safeURL(href);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer">[图片：${escapeHTML(text)}]</a>`:`[图片：${escapeHTML(text)}]`;},
  table(token){let header='',body='';for(const cell of token.header)header+=this.tablecell(cell);for(const row of token.rows){let cells='';for(const cell of row)cells+=this.tablecell(cell);body+=`<tr>${cells}</tr>`;}return `<div class="md-table"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;}
}});
export function renderMarkdown(source){return parser.parse(source);}
export const sample=`# 如何让 AI 回答更容易阅读？

好的排版不仅是文字整齐，更要让读者一眼看懂**哪些内容属于同一组**。在这里，你可以边修改 Markdown，边调试回答的字号、行高和模块间距。

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
.answer p + h3 {
  margin-top: 24px;
}

.answer h2 + h3 {
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

**提示：** 原始 HTML 会显示为文本，图片仅显示链接；编辑内容不会触发外部图片加载。
`;
