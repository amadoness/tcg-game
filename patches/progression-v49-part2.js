  const originalPerformUniqueActiveV49=performUniqueActive;
  performUniqueActive=async function(att,allies,enemies,active){
    if(!isDungeonCard(att.card))return originalPerformUniqueActiveV49(att,allies,enemies,active);
    const foes=()=>living(enemies);if(!foes().length)return;
    if(active.dungeon==='midas'){
      const t=chooseTarget(enemies),d=applyDamage(att,t,active.power||.35);
      const key='v49MidasDefDown';
      if(t.hp>0&&!t[key]){t[key]=true;t.stats.def=Math.max(1,Math.round(t.stats.def*(1-(active.defDown||.05))))}
      logBattle(`${unitName(att)}「${active.name}」→ ${unitName(t)} ${d}ダメージ / 防御-${Math.round((active.defDown||.05)*100)}%`,'logSkill');
    }else if(active.dungeon==='valga'){
      const t=chooseTarget(enemies);let total=0;
      for(let i=0;i<(active.hits||2)&&t.hp>0;i++){total+=applyDamage(att,t,active.power||.18);await battlePause(35)}
      logBattle(`${unitName(att)}「${active.name}」→ ${unitName(t)} ${active.hits||2}連撃 計${total}`,'logSkill');
    }else if(active.dungeon==='crystal'){
      const targets=living(allies).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,active.targets||1);
      for(const u of targets){addShield(u,u.maxHp*(active.shield||.05));refreshUnit(u,'heal')}
      logBattle(`${unitName(att)}「${active.name}」→ HPの低い味方${targets.length}体にシールド`,'logHeal');
    }
  };

  const originalPerformUltimateV49=performUltimate;
  performUltimate=async function(att,allies,enemies){
    if(!isDungeonCard(att.card))return originalPerformUltimateV49(att,allies,enemies);
    const ult=getUltimate(att.card);if(!ult||!living(enemies).length)return false;
    const rank=cardLimitRank(att.card),lv=att.side==='ally'?ultimateLevel(att.card):1;
    let pm=ultimatePowerMult(att);
    if(dungeonRun&&att.side==='ally')pm*=1+.15*dungeonRun.buffs.filter(x=>x==='ult').length;
    att.ultimateUsed=true;
    await showUltimateFX(att,ult,lv);
    logBattle(`ULTIMATE！ ${unitName(att)}「${ult.name}」 Lv.${lv}`,'logSkill');
    const foes=()=>living(enemies),friends=()=>living(allies);let total=0;
    if(att.card.id==='dg01'){
      const power=(rank>=10?.70:.45)*pm;
      for(const t of foes())total+=applyDamage(att,t,power);
      if(rank>=10)addShield(att,att.maxHp*.15*pm);
      logBattle(`敵全体に計${total}ダメージ${rank>=10?' / 自身シールド':''}`,'logSkill');
    }else if(att.card.id==='dg02'){
      const t=chooseTarget(enemies);
      if(rank>=10){for(let i=0;i<3&&t.hp>0;i++)total+=applyDamage(att,t,.32*pm,{ignoreDef:.10});logBattle(`${unitName(t)}に3連撃 計${total} / 防御10%無視`,'logSkill')}
      else{total=applyDamage(att,t,.60*pm);logBattle(`${unitName(t)}に${total}ダメージ`,'logSkill')}
    }else if(att.card.id==='dg03'){
      const healPct=(rank>=10?.10:.05)*pm;
      for(const u of friends()){const h=Math.round(u.maxHp*healPct);u.hp=Math.min(u.maxHp,u.hp+h);if(rank>=10)addShield(u,u.maxHp*.10*pm);refreshUnit(u,'heal')}
      logBattle(`味方全体を回復${rank>=10?'＋シールド':''}`,'logHeal');
    }
    if(att.side==='ally'){
      const g=grantUltimateUse(att.card);
      if(g.afterLevel>g.beforeLevel)logBattle(`${att.card.name} 必殺技Lv ${g.beforeLevel} → ${g.afterLevel}！`,'logSkill');
    }
    return true;
  };

  const originalOpenCardViewerV49=openCardViewer;
  openCardViewer=function(c){
    originalOpenCardViewerV49(c);
    if(!isDungeonCard(c))return;
    const box=document.getElementById('viewerCard');if(!box)return;
    const r=cardLimitRank(c),note=document.createElement('div');
    note.className='v49DungeonCardNote';
    note.innerHTML=`<b>ダンジョン専用カード</b><span>★0では基礎性能が低め。★5でACTIVE、★8でPASSIVE、★10でULTIMATEが完成。限界突破は累計30枚で★10。</span><em>現在 ★${r} / 10</em>`;
    box.appendChild(note);
  };

  function availableReplayStarts(){
    const maxEnd=Math.floor(Math.max(0,Number(state.bestFloor)||0)/5)*5;
    const out=[];for(let start=1;start+4<=maxEnd;start+=5)out.push(start);return out;
  }
  function normalizeReplayBlock(){
    const starts=availableReplayStarts();if(!starts.length)return null;
    let start=Number(state.replayBlockStart);
    if(!starts.includes(start))start=starts[starts.length-1];
    state.replayBlockStart=start;
    if(state.battleMode==='replay'&&(state.replayFloor<start||state.replayFloor>start+4))state.replayFloor=start;
    return {start,end:start+4};
  }
  const originalPreviousBlockRangeV49=previousBlockRange;
  previousBlockRange=function(){
    if(dungeonRun)return {start:1,end:5};
    return normalizeReplayBlock();
  };

  function ensureReplaySelector(){
    const sw=document.querySelector('.towerModeSwitch');if(!sw)return;
    let wrap=document.getElementById('v49ReplayPicker');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='v49ReplayPicker';wrap.className='v49ReplayPicker';
      wrap.innerHTML='<label>周回する5階層</label><select id="v49ReplaySelect"></select><small>選んだ5階区間を先頭→末尾でループ</small>';
      sw.insertAdjacentElement('afterend',wrap);
      wrap.querySelector('select').onchange=e=>{state.replayBlockStart=Number(e.target.value)||1;state.replayFloor=state.replayBlockStart;save();renderBattle()};
    }
    const sel=wrap.querySelector('select'),starts=availableReplayStarts();
    wrap.style.display=starts.length&&(state.bestFloor||0)>=15&&!dungeonRun?'grid':'none';
    if(!starts.length)return;
    normalizeReplayBlock();
    sel.innerHTML=starts.map(s=>`<option value="${s}">${s}〜${s+4}F</option>`).join('');sel.value=String(state.replayBlockStart);
  }
