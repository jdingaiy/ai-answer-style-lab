const round=value=>Math.round(value*100)/100;
const relativeRect=(rect,origin)=>({x:round(rect.left-origin.left),y:round(rect.top-origin.top),width:round(rect.width),height:round(rect.height)});

function textBlocks(answer,origin){
  const selector='h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,th,td';
  return [...answer.querySelectorAll(selector)].filter(element=>{
    if(element.matches('li')&&element.querySelector(':scope > p,:scope > ol,:scope > ul'))return false;
    if(element.matches('blockquote')&&element.querySelector(':scope > p'))return false;
    return !element.closest('th,td')||element.matches('th,td');
  }).map((element,index)=>{
    const rect=element.getBoundingClientRect(),style=getComputedStyle(element),tag=element.tagName.toLowerCase();
    let text=element.innerText.trim();
    if(tag==='li'){
      const list=element.parentElement;
      const prefix=list?.tagName==='OL'?`${[...list.children].filter(child=>child.tagName==='LI').indexOf(element)+1}. `:'• ';
      text=prefix+text;
    }
    return {name:`${tag.toUpperCase()} ${index+1}`,tag,text,...relativeRect(rect,origin),fontSize:parseFloat(style.fontSize)||16,fontWeight:parseInt(style.fontWeight,10)||400,lineHeight:parseFloat(style.lineHeight)||24,letterSpacing:parseFloat(style.letterSpacing)||0,color:style.color,textAlign:style.textAlign};
  }).filter(item=>item.text&&item.width>0&&item.height>0);
}

function backgrounds(answer,origin){
  const items=[];
  for(const element of answer.querySelectorAll('pre,blockquote,th,td')){
    const rect=element.getBoundingClientRect(),style=getComputedStyle(element),tag=element.tagName.toLowerCase();
    items.push({name:`${tag.toUpperCase()} 背景`,...relativeRect(rect,origin),fill:style.backgroundColor,stroke:style.borderColor,strokeWidth:parseFloat(style.borderTopWidth)||0,radius:parseFloat(style.borderRadius)||0});
    if(tag==='blockquote')items.push({name:'引用竖线',x:round(rect.left-origin.left),y:round(rect.top-origin.top),width:Math.max(1,parseFloat(style.borderLeftWidth)||3),height:round(rect.height),fill:style.borderLeftColor,stroke:'transparent',strokeWidth:0,radius:0});
  }
  for(const element of answer.querySelectorAll('mark,highlight')){
    const style=getComputedStyle(element);
    for(const rect of element.getClientRects())items.push({name:element.tagName.toLowerCase()==='mark'?'Mark 标记':'Highlight 高亮',...relativeRect(rect,origin),fill:style.backgroundColor==='rgba(0, 0, 0, 0)'?style.backgroundImage.match(/rgba?\([^)]+\)|#[\da-f]{3,8}/i)?.[0]||'rgba(0,0,0,0)':style.backgroundColor,stroke:'transparent',strokeWidth:0,radius:0});
  }
  for(const element of answer.querySelectorAll('hr')){
    const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
    items.push({name:'分割线',...relativeRect(rect,origin),height:Math.max(1,round(rect.height)),fill:style.backgroundColor,stroke:'transparent',strokeWidth:0,radius:0});
  }
  return items.filter(item=>item.width>0&&item.height>0);
}

function images(answer,origin){
  return [...answer.querySelectorAll('img')].map((image,index)=>({name:`图片 ${index+1}`,src:image.currentSrc||image.src,...relativeRect(image.getBoundingClientRect(),origin),radius:parseFloat(getComputedStyle(image).borderRadius)||0})).filter(item=>item.src&&item.width>0&&item.height>0);
}

export function buildFigmaScripterScript(frame,answer,sceneName){
  const origin=frame.getBoundingClientRect(),style=getComputedStyle(frame);
  const data={name:`AI 回答 · ${sceneName}`,width:round(origin.width),height:round(Math.max(frame.scrollHeight,origin.height)),background:style.backgroundColor,border:style.borderColor,borderWidth:parseFloat(style.borderTopWidth)||0,radius:parseFloat(style.borderRadius)||0,backgrounds:backgrounds(answer,origin),images:images(answer,origin),texts:textBlocks(answer,origin)};
  return `// AI 回答样式实验室 · Figma Scripter 可编辑图层\n(async()=>{\nconst data=${JSON.stringify(data)};\nconst rgba=value=>{const match=String(value||'').match(/[\\d.]+/g)||[];if(value?.startsWith('#')){const hex=value.slice(1);const full=hex.length===3?[...hex].map(x=>x+x).join(''):hex;return {color:{r:parseInt(full.slice(0,2),16)/255,g:parseInt(full.slice(2,4),16)/255,b:parseInt(full.slice(4,6),16)/255},opacity:full.length>6?parseInt(full.slice(6,8),16)/255:1};}return {color:{r:(+match[0]||0)/255,g:(+match[1]||0)/255,b:(+match[2]||0)/255},opacity:match[3]===undefined?1:+match[3]};};\nconst paint=value=>{const c=rgba(value);return [{type:'SOLID',color:c.color,opacity:c.opacity}];};\nconst frame=figma.createFrame();frame.name=data.name;frame.resize(data.width,data.height);frame.fills=paint(data.background);frame.cornerRadius=data.radius;frame.clipsContent=true;if(data.borderWidth){frame.strokes=paint(data.border);frame.strokeWeight=data.borderWidth;}const center=figma.viewport.center;frame.x=center.x-data.width/2;frame.y=center.y-data.height/2;\nconst rect=item=>{const node=figma.createRectangle();node.name=item.name;node.x=item.x;node.y=item.y;node.resize(Math.max(1,item.width),Math.max(1,item.height));node.fills=paint(item.fill);node.cornerRadius=item.radius||0;if(item.strokeWidth){node.strokes=paint(item.stroke);node.strokeWeight=item.strokeWidth;}frame.appendChild(node);return node;};data.backgrounds.forEach(rect);\nfor(const item of data.images){const node=figma.createRectangle();node.name=item.name;node.x=item.x;node.y=item.y;node.resize(item.width,item.height);node.cornerRadius=item.radius||0;try{const image=await figma.createImageAsync(item.src);node.fills=[{type:'IMAGE',imageHash:image.hash,scaleMode:'FILL'}];}catch{node.fills=paint('#eef1f5');}frame.appendChild(node);}\nconst fonts=await figma.listAvailableFontsAsync();const families=['PingFang SC','Noto Sans CJK SC','Noto Sans SC','Arial','Inter'];const findFont=weight=>{const style=weight>=700?'Bold':weight>=600?'SemiBold':weight>=500?'Medium':'Regular';for(const family of families){const exact=fonts.find(x=>x.fontName.family===family&&x.fontName.style.toLowerCase()===style.toLowerCase());if(exact)return exact.fontName;const regular=fonts.find(x=>x.fontName.family===family&&/regular|normal/i.test(x.fontName.style));if(regular)return regular.fontName;}return fonts[0].fontName;};const loaded=new Set();\nfor(const item of data.texts){const font=findFont(item.fontWeight),key=font.family+'-'+font.style;if(!loaded.has(key)){await figma.loadFontAsync(font);loaded.add(key);}const node=figma.createText();node.name=item.name;node.fontName=font;node.fontSize=item.fontSize;node.lineHeight={unit:'PIXELS',value:item.lineHeight};node.letterSpacing={unit:'PIXELS',value:item.letterSpacing};node.fills=paint(item.color);node.characters=item.text;node.resize(Math.max(1,item.width),Math.max(1,item.height));node.textAutoResize='HEIGHT';node.x=item.x;node.y=item.y;if(item.textAlign==='center')node.textAlignHorizontal='CENTER';else if(item.textAlign==='right'||item.textAlign==='end')node.textAlignHorizontal='RIGHT';frame.appendChild(node);}\nfigma.currentPage.selection=[frame];figma.viewport.scrollAndZoomIntoView([frame]);figma.notify('AI 回答已生成，可编辑文字和图层');figma.closePlugin();\n})().catch(error=>{figma.notify('生成失败：'+error.message,{error:true});console.error(error);});`;
}
