// v47: show the current lap while replay AUTO is running.
(()=>{
  'use strict';

  function ensureLoopIndicator(){
    if(document.getElementById('v47LoopProgress'))return;
    const panel=document.querySelector('.autoBattlePanel');
    const hint=document.getElementById('autoBattleHint');
    if(!panel||!hint)return;
    const style=document.createElement('style');
    style.id='v47LoopProgressCss';
    style.textContent=`
      .v47LoopProgress{display:none;margin:7px 0 0;padding:9px 11px;border:1px solid #42506b;background:#0c1320;border-radius:10px;text-align:center;font-size:10px;font-weight:1000;color:#dbe8ff;letter-spacing:.03em}
      .v47LoopProgress.show{display:block}
      .v47LoopProgress b{font-size:14px;color:#ffe08a;margin:0 3px}
      .v47LoopProgress small{display:block;margin-top:3px;color:#8797af;font-size:8px;font-weight:700}
    `;
    document.head.appendChild(style);
    const el=document.createElement('div');
    el.id='v47LoopProgress';
    el.className='v47LoopProgress';
    hint.insertAdjacentElement('beforebegin',el);
  }

  function refreshLoopIndicator(){
    ensureLoopIndicator();
    const el=document.getElementById('v47LoopProgress');
    if(!el)return;

    const running=typeof autoBattleRunning!=='undefined'&&autoBattleRunning;
    const session=typeof autoBattleSession!=='undefined'?autoBattleSession:null;
    if(!running||!session||session.mode!=='replay'){
      el.classList.remove('show');
      el.innerHTML='';
      return;
    }

    const max=Math.max(1,Number(session.maxLoops)||1);
    const current=Math.min(max,(Number(session.loops)||0)+1);
    const start=session.rangeStart??'';
    const end=session.rangeEnd??'';
    const floor=(typeof activeBattleFloor==='function'?activeBattleFloor():state.replayFloor)||'';
    el.innerHTML=`現在 <b>${current}</b> / ${max}周目<small>${start&&end?`${start}〜${end}Fを周回中 / 現在 ${floor}F`:`現在 ${floor}F`}</small>`;
    el.classList.add('show');
  }

  const originalRenderBattleV47=renderBattle;
  renderBattle=function(...args){
    const r=originalRenderBattleV47.apply(this,args);
    refreshLoopIndicator();
    return r;
  };

  const originalUpdateAutoBattleUIV47=updateAutoBattleUI;
  updateAutoBattleUI=function(...args){
    const r=originalUpdateAutoBattleUIV47.apply(this,args);
    refreshLoopIndicator();
    return r;
  };

  ensureLoopIndicator();
  refreshLoopIndicator();
})();
