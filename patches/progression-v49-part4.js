  function ensureV49Css(){
    if(document.getElementById('v49Css'))return;
    const s=document.createElement('style');s.id='v49Css';s.textContent=`
      .v49ReplayPicker{display:grid;grid-template-columns:auto minmax(110px,180px) 1fr;gap:8px;align-items:center;margin:8px 0;padding:9px 11px;border:1px solid #334158;background:#0a101a;border-radius:11px;font-size:9px;color:#9eacc1}.v49ReplayPicker label{font-weight:1000;color:#dce7fa}.v49ReplayPicker select{border:1px solid #46536b;background:#121a28;color:#fff;border-radius:8px;padding:7px}.v49ReplayPicker small{font-size:8px;color:#8795aa}
      .v49DungeonCardNote{margin-top:9px;padding:10px;border:1px solid #80662e;background:#211a0b;border-radius:10px}.v49DungeonCardNote b{display:block;color:#ffe08a;font-size:11px}.v49DungeonCardNote span{display:block;color:#b9c2d0;font-size:9px;line-height:1.5;margin-top:3px}.v49DungeonCardNote em{display:block;color:#fff;font-style:normal;font-size:10px;margin-top:5px;font-weight:900}
      .v49DungeonTop{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.v49KeyBox{border:1px solid #6d5730;background:#211a0b;border-radius:12px;padding:10px 14px;color:#ffe3a0;font-weight:1000}.v49DungeonGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.v49DungeonChoice{border:1px solid #35405a;background:#0c121d;color:#eaf1ff;border-radius:13px;padding:12px;text-align:left}.v49DungeonChoice.active{border-color:#d49a31;box-shadow:0 0 0 1px #d49a3155;background:#18130a}.v49DungeonChoice b{display:block;font-size:13px;color:#ffe3a0}.v49DungeonChoice span{display:block;font-size:9px;color:#9cabc1;line-height:1.45;margin-top:5px}.v49DungeonChoice em{display:block;font-style:normal;font-size:8px;color:#d4bd82;margin-top:7px}.v49Diffs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:9px 0}.v49Diff{border:1px solid #3a465d;background:#101724;color:#dfe9ff;border-radius:10px;padding:9px;font-weight:1000}.v49Diff.active{border-color:#55a8ff;background:#102b47}.v49Diff:disabled{opacity:.35}.v49DungeonInfo{display:grid;grid-template-columns:1.2fr .8fr;gap:10px}.v49InfoBox{border:1px solid #303b50;background:#090e16;border-radius:12px;padding:11px}.v49InfoBox h3{margin:0 0 7px;font-size:12px;color:#ffe2a0}.v49InfoBox p{margin:4px 0;font-size:9px;color:#a9b6c8;line-height:1.55}.v49Rates{display:grid;grid-template-columns:1fr auto;gap:5px;font-size:9px}.v49Rates b{color:#f5f8ff}.v49Rates span:nth-child(even){color:#ffe08a;font-weight:900}.v49DungeonStart{width:100%;margin-top:10px;border:1px solid #d79b2f;background:linear-gradient(#6b4d11,#3c2a09);color:#fff1c6;border-radius:12px;padding:12px;font-size:14px;font-weight:1000}.v49DungeonStart:disabled{opacity:.35}.v49BuffPanel{margin:11px 0;padding:12px;border:1px solid #725d2e;background:#171209;border-radius:13px}.v49BuffPanel h3{margin:0 0 8px;color:#ffe08a;font-size:13px}.v49BuffGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v49BuffGrid button{border:1px solid #42516c;background:#111a28;color:#eaf2ff;border-radius:10px;padding:10px;font-weight:900}.v49Result{margin-top:10px;padding:11px;border:1px solid #334158;background:#0a1019;border-radius:12px;font-size:9px;line-height:1.65}.v49Result b{color:#ffe08a}.v49DungeonProgress{color:#ffe08a;font-weight:1000}.v49DungeonCardLine{margin-top:8px;padding-top:8px;border-top:1px solid #283247}
      @media(max-width:650px){.v49ReplayPicker{grid-template-columns:1fr 1fr}.v49ReplayPicker small{grid-column:1/-1}.v49DungeonGrid{grid-template-columns:1fr}.v49DungeonInfo{grid-template-columns:1fr}.v49BuffGrid{grid-template-columns:1fr}.v49DungeonTop{grid-template-columns:1fr}.v49KeyBox{text-align:center}}
    `;document.head.appendChild(s);
  }

  function buildDungeonUi(){
    ensureV49Css();
    const tabs=document.querySelector('.tabs'),battleTab=tabs?.querySelector('[data-tab="battle"]');
    if(tabs&&!tabs.querySelector('[data-tab="dungeon"]')){
      const b=document.createElement('button');b.className='tabbtn';b.dataset.tab='dungeon';b.textContent='ダンジョン';b.onclick=()=>{if((state.bestFloor||0)>=25){switchToView('dungeon');renderDungeon()}};
      battleTab?.insertAdjacentElement('afterend',b);
    }
    if(!document.getElementById('dungeon')){
      const sec=document.createElement('section');sec.id='dungeon';sec.className='view';sec.innerHTML='<div class="panel" id="v49DungeonRoot"></div>';
      document.getElementById('battle')?.insertAdjacentElement('afterend',sec);
    }
  }
  function currentDungeon(){return DUNGEONS[state.dungeonSelected]||DUNGEONS.gold}
  function currentDiff(){return DUNGEON_DIFF[state.dungeonDifficulty]||DUNGEON_DIFF.normal}
  function cardDropLabel(d){return `${Math.round(d.cardDrop*100)}%`}
  function crystalDropLabel(d){return `${Math.round(d.crystalDrop*100)}%`}
  function dungeonSpecificRewards(cfg,d){
    if(cfg.id==='gold')return d.id==='normal'?'COIN 約500〜700C':d.id==='hard'?'COIN 約900〜1,200C':'COIN 約1,500〜2,000C';
    if(cfg.id==='training')return d.id==='normal'?'PLAYER EXP 180 / 熟練12 / ULT8':d.id==='hard'?'PLAYER EXP 320 / 熟練22 / ULT15':'PLAYER EXP 520 / 熟練36 / ULT25';
    return `限界結晶 ${crystalDropLabel(d)}（1個）`;
  }
  function renderDungeon(){
    ensureDungeonState();buildDungeonUi();
    const tab=document.querySelector('.tabbtn[data-tab="dungeon"]');if(tab)tab.style.display=(state.bestFloor||0)>=25?'':'none';
    const root=document.getElementById('v49DungeonRoot');if(!root)return;
    if((state.bestFloor||0)<25){root.innerHTML='<h2>ダンジョン</h2><div class="hint">無限の塔25F突破で解禁。</div>';return}
    const cfg=currentDungeon(),d=currentDiff(),boss=CARDS.find(c=>c.id===cfg.bossId),rank=boss?cardLimitRank(boss):0,count=boss?Number(state.counts[boss.id]||0):0;
    const diffButtons=Object.values(DUNGEON_DIFF).map(x=>`<button class="v49Diff ${x.id===d.id?'active':''}" data-v49-diff="${x.id}" ${(state.bestFloor||0)<x.unlock?'disabled':''}>${x.label}<br><small>${x.unlock}F</small></button>`).join('');
    let runBlock='';
    if(dungeonRun){
      const rcfg=DUNGEONS[dungeonRun.id],rd=DUNGEON_DIFF[dungeonRun.diff];
      if(dungeonRun.awaitingBuff)runBlock=`<div class="v49BuffPanel"><h3>${rcfg.name} ${rd.label}　探索中：強化を1つ選択</h3><p>2戦目・4戦目の後に、その探索中だけ有効なバフを選べます。</p><div class="v49BuffGrid"><button data-v49-buff="atk">⚔ 攻撃力 +10%</button><button data-v49-buff="hp">♥ 最大HP +15%</button><button data-v49-buff="ult">✦ ULTIMATE威力 +15%</button></div></div>`;
      else runBlock=`<div class="v49BuffPanel"><h3>${rcfg.name} ${rd.label}　<span class="v49DungeonProgress">${Math.min(5,dungeonRun.stage)} / 5戦</span></h3><button class="v49DungeonStart" id="v49ResumeDungeon">探索へ戻る</button></div>`;
    }
    const last=state.lastDungeonResult;
    const lastBlock=last?`<div class="v49Result"><b>${last.win?'CLEAR':'FAILED'}：${last.name} ${last.diff}</b><br>${(last.lines||[]).join('<br>')}</div>`:'';
    root.innerHTML=`
      <div class="v49DungeonTop"><div><h2 class="sectionTitle" style="margin-bottom:3px">ダンジョン</h2><div class="hint">無限の塔で集めたキーを1個使い、全5戦を攻略。難易度に関係なく消費キーは1個。</div></div><div class="v49KeyBox">🔑 ダンジョンキー ×${state.dungeonKeys||0}</div></div>
      <div class="v49DungeonGrid">${Object.values(DUNGEONS).map(x=>`<button class="v49DungeonChoice ${x.id===cfg.id?'active':''}" data-v49-dungeon="${x.id}"><b>${x.name}</b><span>${x.desc}</span><em>専用DROP：${CARDS.find(c=>c.id===x.bossId)?.name||''}</em></button>`).join('')}</div>
      ${runBlock}
      <div class="v49DungeonInfo"><div class="v49InfoBox"><h3>${cfg.name}</h3><p>${cfg.desc}</p><div class="v49Diffs">${diffButtons}</div><div class="v49Rates"><b>消費キー</b><span>1個</span><b>全戦闘</b><span>5戦（3戦目エリート / 5戦目ボス）</span><b>専用カードDROP</b><span>${cardDropLabel(d)}</span><b>主報酬</b><span>${dungeonSpecificRewards(cfg,d)}</span>${cfg.id==='crystal'?`<b>限界結晶</b><span>${crystalDropLabel(d)}</span>`:''}</div><button class="v49DungeonStart" id="v49DungeonStart" ${dungeonRun||state.dungeonKeys<1||state.team.length!==3?'disabled':''}>${dungeonRun?'探索中':`挑戦する（キー1個）`}</button></div>
      <div class="v49InfoBox"><h3>ダンジョンキー</h3><p>塔25F突破時に3個支給。以降は塔の勝利で低確率DROP。</p><div class="v49Rates"><b>通常階</b><span>0.05%</span><b>5の倍数階・ボス</b><span>1.5%</span><b>新しい5階区間の初突破</b><span>30F以降 +1個</span></div><div class="v49DungeonCardLine"><b>${boss?.name||''}</b><p>所持 ${count}枚 / ★${rank}。ダンジョン産は累計30枚で★10。★5 ACTIVE強化 → ★8 PASSIVE強化 → ★10 ULTIMATE完成。</p><p>${boss?limitProgressText(boss):''}</p></div><p>NORMAL：25F / HARD：40F / HELL：60Fで解禁。</p></div></div>
      ${lastBlock}`;
    root.querySelectorAll('[data-v49-dungeon]').forEach(b=>b.onclick=()=>{if(dungeonRun)return;state.dungeonSelected=b.dataset.v49Dungeon;save();renderDungeon()});
    root.querySelectorAll('[data-v49-diff]').forEach(b=>b.onclick=()=>{if(dungeonRun)return;state.dungeonDifficulty=b.dataset.v49Diff;save();renderDungeon()});
    root.querySelectorAll('[data-v49-buff]').forEach(b=>b.onclick=()=>chooseDungeonBuff(b.dataset.v49Buff));
    const start=document.getElementById('v49DungeonStart');if(start)start.onclick=()=>startDungeonRun(cfg.id,d.id);
    const resume=document.getElementById('v49ResumeDungeon');if(resume)resume.onclick=()=>{switchToView('battle');renderBattle()};
  }

  const originalRenderBattleV49=renderBattle;
  renderBattle=function(...args){
    const r=originalRenderBattleV49.apply(this,args);ensureReplaySelector();
    const sw=document.querySelector('.towerModeSwitch'),auto=document.querySelector('.autoBattlePanel'),picker=document.getElementById('v49ReplayPicker');
    const header=document.querySelector('#battle .battleHeader h2'),hint=document.querySelector('#battle .battleHeader .hint');
    if(dungeonRun){
      const cfg=DUNGEONS[dungeonRun.id],d=DUNGEON_DIFF[dungeonRun.diff],stage=Math.max(1,Math.min(5,Number(state.replayFloor)||dungeonRun.stage||1));
      if(sw)sw.style.display='none';if(auto)auto.style.display='none';if(picker)picker.style.display='none';
      if(header)header.textContent=`ダンジョン：${cfg.name}`;if(hint)hint.textContent=`${d.label} / 全5戦 / キー消費済み`;
      if($('battleModeLabel'))$('battleModeLabel').textContent='DUNGEON';if($('battleFloor'))$('battleFloor').textContent=`${stage} / 5`;
      if($('battleReward'))$('battleReward').textContent='CLEAR報酬';
      if($('towerEconomy'))$('towerEconomy').innerHTML=`<b>${cfg.name} ${d.label}</b>　${stage}/5戦${dungeonRun.buffs.length?`<br>探索バフ：${dungeonRun.buffs.map(x=>x==='atk'?'攻撃+10%':x==='hp'?'最大HP+15%':'ULT威力+15%').join(' / ')}`:''}`;
      if($('enemyPreview'))$('enemyPreview').innerHTML=stage===5?`<strong>BOSS：${CARDS.find(c=>c.id===cfg.bossId)?.name}</strong><br>${cfg.bossDesc}`:`<strong>${stage===3?'ELITE':'BATTLE'} ${stage} / 5</strong><br>${cfg.name}の敵が出現。`;
      if($('battleStartBtn')&&!battleBusy)$('battleStartBtn').textContent=`第${stage}戦　戦闘開始`;
    }else{
      if(sw)sw.style.display='';if(auto)auto.style.display='';if(header)header.textContent='無限の塔';if(hint)hint.textContent='5階ごとにチェックポイント。周回する5階区間は自由に選択できる。';
      ensureReplaySelector();
    }
    return r;
  };

  const originalUpdateStatsV49=updateStats;
  updateStats=function(...args){const r=originalUpdateStatsV49.apply(this,args);renderDungeon();return r};

  buildDungeonUi();ensureReplaySelector();renderDungeon();
  const sub=document.querySelector('.sub');if(sub&&sub.textContent.includes('全96種'))sub.textContent=sub.textContent.replace('全96種','全99種（ガチャ96＋ダンジョン3）');
  save();
})();
