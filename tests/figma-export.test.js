import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildFigmaScripterScript} from '../dist/figma-export.js';

test('Figma export creates an editable Scripter program without an instruction modal',()=>{
  const rect={left:0,top:0,width:390,height:640};
  const frame={scrollHeight:640,getBoundingClientRect:()=>rect};
  const answer={querySelectorAll:()=>[]};
  global.getComputedStyle=()=>({backgroundColor:'rgb(255, 255, 255)',borderColor:'rgb(227, 231, 237)',borderTopWidth:'1px',borderRadius:'10px'});
  const script=buildFigmaScripterScript(frame,answer,'App · AI 搜索');
  assert.match(script,/figma\.createFrame\(\)/);
  assert.match(script,/figma\.createText\(\)/);
  assert.match(script,/figma\.createImageAsync/);
  assert.match(script,/AI 回答 · App · AI 搜索/);
  assert.doesNotMatch(script,/showUI|三步/);
  assert.doesNotThrow(()=>new Function(script));
});
