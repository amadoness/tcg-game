// v50: freely choose any cleared 5-floor block for tower replay.
(()=>{
  'use strict';

  function replayStarts(){
    const maxEnd=Math.floor(Math.max(0,Number(state.bestFloor)||0)/5)*5;
    const out=[];
    for(let start=1;start+4<=maxEnd;start+=5)out.push(start);
    return out;
  }

  function normalizeReplayBlock(){
    const starts=replayStarts();
    if(!starts.length)return null;
    let start=Number(state.replayBlockStart);
    if(!starts.includes(start))start=starts[starts.length-1];
    state.replayBlockStart=start;
    if(state.battleMode==='replay'&&(state.replayFloor<start||state.replayFloor>start+4))state.replayFloor=start;
    return {start,end:start+4};
  }

  previousBlockRange=function(){
    return normalizeReplayBlock();
  };

  function ensureReplayPicker(){
    const sw=document.querySelector('.towerModeSwitch');
    if(!sw)return;
    let box=document.getElementById('v50ReplayPicker');
    if(!box){
      const style=document.createElement('style');
      style.id='v50ReplayPickerCss';
      style.textContent=`
        .v50ReplayPicker{display:grid;grid-template-columns:auto minmax(110px,170px) 1fr;gap:8px;align-items:center;margin:8px 0;padding:9px 11px;border:1px solid #334158;background:#0a101a;border-radius:11px;font-size:9px;color:#9eacc1}
        .v50ReplayPicker label{font-weight:1000;color:#dce7fa}.v50ReplayPicker select{border:1px solid #46536b;background:#121a28;color:#fff;border-radius:8px;padding:7px}.v50ReplayPicker small{font-size:8px;color:#8795aa}
        @media(max-width:560px){.v50ReplayPicker{grid-template-columns:1fr 1fr}.v50ReplayPicker small{grid-column:1/-1}}
      `;
      document.head.appendChild(style);
      box=document.createElement('div');
      box.id='v50ReplayPicker';
      box.className='v50ReplayPicker';
      box.innerHTML='<label>周回する階層</label><select id="v50ReplaySelect"></select><small>選択した5階層を先頭→末尾で繰り返します。</small>';
      sw.insertAdjacentElement('afterend',box);
      box.querySelector('select').addEventListener('change',e=>{
        state.replayBlockStart=Number(e.target.value)||1;
        state.replayFloor=state.replayBlockStart;
        save();
        renderBattle();
      });
    }

    const starts=replayStarts(),sel=box.querySelector('select');
    const unlocked=(Number(state.bestFloor)||0)>=15;
    box.style.display=starts.length&&unlocked&&!document.body.classList.contains('v49DungeonBattle')?'grid':'none';
    if(!starts.length)return;
    const range=normalizeReplayBlock();
    sel.innerHTML=starts.map(start=>`<option value="${start}">${start}〜${start+4}F</option>`).join('');
    sel.value=String(range.start);
  }

  const originalRenderBattleV50=renderBattle;
  renderBattle=function(...args){
    const result=originalRenderBattleV50.apply(this,args);
    ensureReplayPicker();
    return result;
  };

  const originalUpdateStatsV50=updateStats;
  updateStats=function(...args){
    const result=originalUpdateStatsV50.apply(this,args);
    ensureReplayPicker();
    return result;
  };

  ensureReplayPicker();
  try{renderBattle()}catch(e){console.warn('v50 replay picker init failed',e)}
})();
