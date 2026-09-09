import {gapSource} from './model.js';

// An independent overlay never participates in Markdown layout or exports.
export function installGapOverlay({frame,answer,toggle,getConfig}) {
  const overlay=document.createElement('div');
  overlay.className='gap-overlay';overlay.setAttribute('aria-hidden','true');frame.append(overlay);
  let pending=0;
  const kinds={P:'body',H1:'h1',H2:'h2',H3:'h3',H4:'h4',H5:'h5',H6:'h6',OL:'ol',UL:'ul',BLOCKQUOTE:'quote',PRE:'code',IMG:'image',HR:'hr'};
  const kind=el=>el.classList.contains('md-table')?'table':el.classList.contains('md-image')?'image':kinds[el.tagName];
  function draw(){
    pending=0;
    overlay.replaceChildren();
    if(!toggle.checked)return;
    const config=getConfig(),base=frame.getBoundingClientRect(),measurements=[];
    // Include nested lists/quotes, but never the table's cells or code lines.
    for(const container of [answer,...answer.querySelectorAll('blockquote,li,ol,ul')]) {
      const children=[...container.children];
      for(let i=1;i<children.length;i++){
        const prev=children[i-1],next=children[i],a=kind(prev),b=kind(next);
        let source;
        if(prev.tagName==='LI' && next.tagName==='LI')source='列表项间距';
        else if(a&&b)source=gapSource(config,a,b);
        else continue;
        const r1=prev.getBoundingClientRect(),r2=next.getBoundingClientRect();
        const gap=r2.top-r1.bottom;
        if(gap<-.5 || !r1.width || !r2.width)continue;
        const left=Math.max(r1.left,r2.left),right=Math.min(r1.right,r2.right);
        if(right<=left)continue;
        measurements.push({top:r1.bottom-base.top-frame.clientTop,left:left-base.left-frame.clientLeft,width:right-left,height:Math.max(0,gap),source});
      }
    }
    const fragment=document.createDocumentFragment();
    for(const m of measurements){
      const band=document.createElement('div');band.className='gap-band';
      Object.assign(band.style,{top:m.top+'px',left:m.left+'px',width:m.width+'px',height:m.height+'px'});
      const label=document.createElement('span');label.className='gap-label';
      label.textContent=`${Number(m.height.toFixed(1))}px · ${m.source}`;
      band.append(label);fragment.append(band);
    }
    overlay.append(fragment);
  }
  const refresh=()=>{if(!pending)pending=requestAnimationFrame(draw);};
  toggle.addEventListener('change',refresh);
  window.addEventListener('resize',refresh);
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(refresh);observer.observe(answer);observer.observe(frame);}
  document.fonts?.ready.then(refresh);
  return refresh;
}
