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

  async function startDungeonSeries(id,diffId,count=1,auto=false){
    if(battleBusy||autoBattleRunning)return;
    ensureDungeonState();
    if(state.dungeonKeys<count){alert(`ダンジョンキーが足りません。必要${count}個 / 所持${state.dungeonKeys}個`);return}
    const totals={runs:0,coins:0,player:0,mastery:0,ultimate:0,crystal:0,cards:0,failed:false};
    for(let i=0;i<count;i++){
      const res=await runSingleDungeon(id,diffId,auto);if(!res.started)break;
      if(!res.win){totals.failed=true;break}
      totals.runs++;totals.coins+=res.reward.coin;totals.player+=res.reward.train.player;totals.mastery+=res.reward.train.mastery;totals.ultimate+=res.reward.train.ultimate;totals.crystal+=res.reward.crystal;totals.cards+=res.reward.cardDrop?1:0;
    }
    document.body.classList.remove('v49DungeonBattle');dungeonRun=null;window.V49DungeonRun=null;switchToView('dungeon');
    lastDungeonResult=`${totals.runs}回クリア${totals.failed?' / 途中で敗北':''}　COIN ${totals.coins.toLocaleString()}C${totals.player?` / PLAYER EXP ${totals.player}`:''}${totals.mastery?` / 熟練EXP ${totals.mastery}/枚`:''}${totals.ultimate?` / ULT EXP ${totals.ultimate}/対象`:''}${totals.crystal?` / 限界結晶 ×${totals.crystal}`:''}${totals.cards?` / 専用カード ×${totals.cards}`:''}`;
    renderDungeon();
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
