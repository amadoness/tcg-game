  function rewardSummary(reward){
    const coinText=reward.coinBonus>0
      ?`COIN ${reward.coinBase.toLocaleString()}C + 黄金の財布 ${reward.coinBonus.toLocaleString()}C = ${reward.coin.toLocaleString()}C`
      :`COIN +${reward.coin.toLocaleString()}C`;
    const p=[coinText];
    if(reward.train.player)p.push(`PLAYER EXP +${reward.train.player}`);
    if(reward.train.mastery)p.push(`熟練EXP +${reward.train.mastery}/枚`);
    if(reward.train.ultimate)p.push(`ULT EXP +${reward.train.ultimate}/対象`);
    if(reward.crystal)p.push('限界結晶 ×1');
    if(reward.cardDrop){const {card,g}=reward.cardDrop;p.push(`${card.name} ×1${g.isNew?' / NEW':''}${g.limitUp?` / ★${g.limitUp}`:''}${g.converted?` / MAX還元 +${g.refund}C`:''}`)}
    return p.join(' / ');
  }

  async function runSingleDungeon(id,diffId,auto=false){
    ensureDungeonState();const d=DUNGEONS[id],df=DIFFICULTIES[diffId];
    if(!d||!df||!difficultyUnlocked(diffId)||state.team.length!==3||state.dungeonKeys<1||battleBusy||autoBattleRunning)return {started:false};
    state.dungeonKeys--;state.dungeonPendingKeyRefund=1;save();
    const run={dungeonId:id,diffId,buffs:{atk:0,hp:0,def:0,spd:0,active:0,ult:0},hpRatios:Object.fromEntries(state.team.map(x=>[x,1])),auto};
    dungeonRun=run;window.V49DungeonRun=run;
    for(let stage=1;stage<=5;stage++){
      const win=await dungeonFight(run,stage);
      if(!win){state.dungeonKeys++;state.dungeonPendingKeyRefund=0;save();dungeonRun=null;window.V49DungeonRun=null;document.body.classList.remove('v49DungeonBattle');return {started:true,win:false}}
      if(stage===2||stage===4){const b=await chooseDungeonBuff(run,auto);logBattle(`探索バフ獲得：「${b.name}」`,'logSkill');ensureDungeonBattleHud(run,stage)}
      if(stage===3){campHeal(run);$('battleResult').className='battleResult win';$('battleResult').textContent='CAMP　全員HP30%回復';logBattle('キャンプ：全員が最大HP30%分回復。戦闘不能も30%で復帰。','logHeal');await battlePause(500)}
    }
    state.dungeonPendingKeyRefund=0;
    const reward=grantDungeonClearReward(run);save();
    dungeonRun=null;window.V49DungeonRun=null;document.body.classList.remove('v49DungeonBattle');
    return {started:true,win:true,reward};
  }

  function ensureDungeonResultModal(){
    if(document.getElementById('v49ResultOverlay'))return;
    const style=document.createElement('style');
    style.id='v49ResultModalCss';
    style.textContent=`
      .v49ResultOverlay{position:fixed;inset:0;z-index:10050;background:rgba(2,6,14,.88);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(7px)}
      .v49ResultOverlay.show{display:flex}
      .v49ResultCard{width:min(92vw,430px);max-height:86vh;overflow:auto;border:1px solid #55657d;background:linear-gradient(180deg,#111927,#080d15);border-radius:18px;padding:18px;box-shadow:0 24px 80px #000c}
      .v49ResultTitle{text-align:center;font-size:20px;font-weight:1000;color:#fff;margin:2px 0 4px}
      .v49ResultSub{text-align:center;font-size:10px;color:#9fb0c8;margin-bottom:14px}
      .v49ResultList{display:grid;gap:7px}
      .v49ResultRow{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 11px;border:1px solid #28354a;background:#0b111c;border-radius:11px}
      .v49ResultRow span{font-size:10px;color:#aebbd0}
      .v49ResultRow b{font-size:12px;color:#fff;text-align:right}
      .v49ResultRow.rare{border-color:#745d24;background:#1b1609}
      .v49ResultRow.rare b{color:#ffe28e}
      .v49ResultNote{margin-top:11px;padding:9px 10px;border-radius:10px;background:#151b25;color:#aebbd0;font-size:9px;line-height:1.55}
      .v49ResultClose{width:100%;margin-top:14px;padding:13px;border:1px solid #8e6f2b;border-radius:12px;background:linear-gradient(#765613,#473109);color:#fff1c9;font-weight:1000;font-size:14px}
    `;
    document.head.appendChild(style);
    const overlay=document.createElement('div');
    overlay.id='v49ResultOverlay';overlay.className='v49ResultOverlay';
    overlay.innerHTML='<div class="v49ResultCard" role="dialog" aria-modal="true"><div class="v49ResultTitle" id="v49ResultTitle">DUNGEON RESULT</div><div class="v49ResultSub" id="v49ResultSub"></div><div class="v49ResultList" id="v49ResultList"></div><div class="v49ResultNote" id="v49ResultNote"></div><button class="v49ResultClose" id="v49ResultClose">閉じる</button></div>';
    document.body.appendChild(overlay);
  }

  function showDungeonResultModal(id,diffId,totals){
    ensureDungeonResultModal();
    const overlay=document.getElementById('v49ResultOverlay');
    const d=DUNGEONS[id],df=DIFFICULTIES[diffId];
    const rows=[];
    rows.push(['クリア回数',`${totals.runs}回`,'']);
    rows.push(['COIN',`+${totals.coins.toLocaleString()}C`,'']);
    if(totals.coinBonus>0)rows.push(['黄金の財布',`+${totals.coinBonus.toLocaleString()}C（10%）`,'rare']);
    if(totals.player>0)rows.push(['PLAYER EXP',`+${totals.player.toLocaleString()}`,'']);
    if(totals.mastery>0)rows.push(['熟練EXP',`+${totals.mastery.toLocaleString()} / 枚`,'']);
    if(totals.ultimate>0)rows.push(['ULTIMATE EXP',`+${totals.ultimate.toLocaleString()} / 対象`,'']);
    if(totals.crystal>0)rows.push(['限界結晶',`×${totals.crystal}`,'rare']);
    if(totals.cards>0)rows.push([d.bossName,`×${totals.cards}`,'rare']);
    rows.push(['ダンジョンキー',`-${totals.runs}`,'']);
    document.getElementById('v49ResultTitle').textContent=totals.failed?'DUNGEON END':'DUNGEON CLEAR';
    document.getElementById('v49ResultSub').textContent=`${d.name} ${df.label}　獲得報酬`;
    document.getElementById('v49ResultList').innerHTML=rows.map(([k,v,c])=>`<div class="v49ResultRow ${c}"><span>${k}</span><b>${v}</b></div>`).join('');
    document.getElementById('v49ResultNote').textContent=totals.failed
      ?(totals.runs>0?'次の探索で敗北しました。敗北した回のキーは返却され、報酬は発生していません。':'探索失敗。キーは返却され、獲得報酬はありません。')
      :'5戦すべて突破しました。';
    overlay.classList.add('show');
    return new Promise(resolve=>{
      const close=document.getElementById('v49ResultClose');
      close.onclick=()=>{overlay.classList.remove('show');resolve()};
    });
  }

  async function startDungeonSeries(id,diffId,count=1,auto=false){
    if(battleBusy||autoBattleRunning)return;
    ensureDungeonState();
    if(state.dungeonKeys<count){alert(`ダンジョンキーが足りません。必要${count}個 / 所持${state.dungeonKeys}個`);return}
    const totals={runs:0,coins:0,coinBase:0,coinBonus:0,player:0,mastery:0,ultimate:0,crystal:0,cards:0,failed:false};
    for(let i=0;i<count;i++){
      const res=await runSingleDungeon(id,diffId,auto);if(!res.started)break;
      if(!res.win){totals.failed=true;break}
      totals.runs++;
      totals.coins+=res.reward.coin;
      totals.coinBase+=Number(res.reward.coinBase||res.reward.coin)||0;
      totals.coinBonus+=Number(res.reward.coinBonus||0);
      totals.player+=res.reward.train.player;
      totals.mastery+=res.reward.train.mastery;
      totals.ultimate+=res.reward.train.ultimate;
      totals.crystal+=res.reward.crystal;
      totals.cards+=res.reward.cardDrop?1:0;
    }
    document.body.classList.remove('v49DungeonBattle');dungeonRun=null;window.V49DungeonRun=null;
    lastDungeonResult=`${totals.runs}回クリア${totals.failed?' / 途中で敗北':''}　COIN ${totals.coins.toLocaleString()}C${totals.player?` / PLAYER EXP ${totals.player}`:''}${totals.mastery?` / 熟練EXP ${totals.mastery}/枚`:''}${totals.ultimate?` / ULT EXP ${totals.ultimate}/対象`:''}${totals.crystal?` / 限界結晶 ×${totals.crystal}`:''}${totals.cards?` / ${DUNGEONS[id].bossName} ×${totals.cards}`:''}`;
    await showDungeonResultModal(id,diffId,totals);
    switchToView('dungeon');renderDungeon();
  }

  // Tower hook: keys start dropping after dungeon unlock. New 5-floor blocks from 30F also grant 1 key.
  const originalStartBattleV49=startBattle;
  startBattle=async function(opts={}){
    ensureDungeonState();const beforeBest=Number(state.bestFloor)||0;
    const outcome=await originalStartBattleV49(opts);if(!outcome)return outcome;
    ensureDungeonState();
    let gained=0;
    if(outcome.win&&dungeonUnlocked()){
      const floor=Number(outcome.floor)||1,chance=floor%5===0?DUNGEON_KEY_BOSS_RATE:DUNGEON_KEY_NORMAL_RATE;
      if(Math.random()<chance){state.dungeonKeys++;gained++;logBattle?.('🔑 ダンジョンキー DROP！','logSkill')}
    }
    const afterBest=Number(state.bestFloor)||0;
    if(afterBest>beforeBest&&afterBest>=30&&afterBest%5===0&&!state.dungeonKeyMilestones[afterBest]){
      state.dungeonKeyMilestones[afterBest]=true;state.dungeonKeys++;gained++;logBattle?.(`${afterBest}F 初突破：ダンジョンキー +1`,'logSkill');
    }
    if(gained){save();const el=$('battleResult');if(el&&outcome.win)el.textContent+=` / 🔑KEY +${gained}`}
    if(beforeBest<25&&afterBest>=25){ensureDungeonState();save();alert('ダンジョン解禁！\n初回ボーナスとしてダンジョンキーを3個獲得しました。')}
    updateDungeonTab();if(dungeonUnlocked())renderDungeon();
    return outcome;
  };

  const originalUpdateStatsV49=updateStats;
  updateStats=function(...args){const r=originalUpdateStatsV49.apply(this,args);ensureDungeonState();ensureDungeonUi();updateDungeonTab();if(document.getElementById('dungeon')?.classList.contains('active'))renderDungeon();return r};

  ensureDungeonState();ensureDungeonUi();updateDungeonTab();
  if(dungeonUnlocked())renderDungeon();
  try{renderCollection();renderTeam();save()}catch(e){console.warn('v49 dungeon init refresh failed',e)}
})();
