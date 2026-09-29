  const originalBattleRewardInfoV49=battleRewardInfo;
  battleRewardInfo=function(floor=activeBattleFloor()){
    if(dungeonRun)return {base:0,milestone:0,total:0,replay:true,rawBase:0,rawMilestone:0,bonusBase:0,bonusMilestone:0,bonusTotal:0};
    return originalBattleRewardInfoV49(floor);
  };
  const originalEnemyScaleV49=enemyScale;
  enemyScale=function(f){
    if(!dungeonRun)return originalEnemyScaleV49(f);
    const d=DUNGEON_DIFF[dungeonRun.diff]||DUNGEON_DIFF.normal;
    return d.enemyBase+[0,.02,.04,.065,.10][Math.max(0,Math.min(4,(Number(f)||1)-1))];
  };
  const originalMakeEnemyTeamV49=makeEnemyTeam;
  makeEnemyTeam=function(f){
    if(!dungeonRun)return originalMakeEnemyTeamV49(f);
    const cfg=DUNGEONS[dungeonRun.id],stage=Math.max(1,Math.min(5,Number(f)||1));
    if(stage===5){
      const boss=CARDS.find(c=>c.id===cfg.bossId);const rest=cfg.minions.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);return boss?[{...boss,_dungeonEnemy:true},...rest]:rest;
    }
    return (cfg.enemies[stage-1]||cfg.enemies[0]).map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);
  };
  const originalGetBossSpecV49=getBossSpec;
  getBossSpec=function(f){
    if(!dungeonRun)return originalGetBossSpecV49(f);
    if(Number(f)!==5)return null;
    const cfg=DUNGEONS[dungeonRun.id];
    if(cfg.id==='gold')return {cardId:cfg.bossId,name:cfg.name,minions:cfg.minions,title:cfg.bossTitle,desc:cfg.bossDesc,stat:{hp:1.18,def:1.10},damageTaken:.04};
    if(cfg.id==='training')return {cardId:cfg.bossId,name:cfg.name,minions:cfg.minions,title:cfg.bossTitle,desc:cfg.bossDesc,stat:{hp:1.10,atk:1.12,spd:1.05}};
    return {cardId:cfg.bossId,name:cfg.name,minions:cfg.minions,title:cfg.bossTitle,desc:cfg.bossDesc,stat:{hp:1.14,def:1.08},teamBarrier:.03};
  };

  function goldWalletMult(){return state.treasures?.goldWallet?1.10:1}
  function roundedCoin(n){return Math.round(Number(n||0)/5)*5}
  function randomIntRounded(min,max,step=10){const n=min+Math.random()*(max-min);return Math.round(n/step)*step}
  function dungeonReward(id,diff){
    const d=DUNGEON_DIFF[diff]||DUNGEON_DIFF.normal,cfg=DUNGEONS[id];
    const result={dungeon:id,diff,items:[],coinBase:0,coins:0,card:null,crystal:0,playerExp:0,mastery:0,ultimate:0};
    if(id==='gold'){
      const range=diff==='normal'?[500,700]:diff==='hard'?[900,1200]:[1500,2000];
      result.coinBase=randomIntRounded(range[0],range[1]);result.coins=roundedCoin(result.coinBase*goldWalletMult());
    }else if(id==='training'){
      result.coinBase=diff==='normal'?150:diff==='hard'?250:400;result.coins=roundedCoin(result.coinBase*goldWalletMult());
      const baseXp=diff==='normal'?180:diff==='hard'?320:520;
      const pMult=1+(state.treasures?.adventurerCrown?.10:0)+(state.treasures?.heroProof?.05:0);
      const mMult=1+(state.treasures?.heroProof?.05:0);
      const uMult=1+(state.treasures?.ultimateGuide?.20:0)+(state.treasures?.ultimateOrb?.10:0)+(state.treasures?.heroProof?.05:0);
      result.playerExp=Math.round(baseXp*pMult);
      result.mastery=(diff==='normal'?12:diff==='hard'?22:36)*mMult;
      result.ultimate=(diff==='normal'?8:diff==='hard'?15:25)*uMult;
    }else if(id==='crystal'){
      result.coinBase=diff==='normal'?120:diff==='hard'?220:360;result.coins=roundedCoin(result.coinBase*goldWalletMult());
      if(Math.random()<d.crystalDrop){result.crystal=1;state.consumables=state.consumables||{};state.consumables.limitCrystal=(Number(state.consumables.limitCrystal)||0)+1}
    }
    if(result.coins>0)state.coins=(state.coins||0)+result.coins;
    if(result.playerExp>0)state.playerExp=(Number(state.playerExp)||0)+result.playerExp;
    if(result.mastery>0){
      for(const id of state.team){const c=CARDS.find(x=>x.id===id);if(c)grantMasteryExp(c,result.mastery)}
    }
    if(result.ultimate>0){
      state.ultimateUses=state.ultimateUses||{};
      for(const id of state.team){const c=CARDS.find(x=>x.id===id);if(c&&getUltimate(c))state.ultimateUses[id]=(Number(state.ultimateUses[id])||0)+result.ultimate}
    }
    if(Math.random()<d.cardDrop){
      const c=CARDS.find(x=>x.id===cfg.bossId);if(c){const g=grantOwnedCopy(c);result.card={id:c.id,name:c.name,rarity:c.r,isNew:g.isNew,limitUp:g.limitUp,converted:g.converted,refund:g.refund}}
    }
    return result;
  }
  function dungeonResultText(r){
    const parts=[];
    if(r.coins)parts.push(`${r.coins.toLocaleString()}C${r.coins>r.coinBase?`（黄金の財布 +${(r.coins-r.coinBase).toLocaleString()}C）`:''}`);
    if(r.playerExp)parts.push(`PLAYER EXP +${Math.floor(r.playerExp)}`);
    if(r.mastery)parts.push(`熟練EXP +${Math.floor(r.mastery)}（編成3枚）`);
    if(r.ultimate)parts.push(`ULTIMATE EXP +${Math.floor(r.ultimate)}（ULT所持カード）`);
    if(r.crystal)parts.push('限界結晶 ×1');
    if(r.card)parts.push(`${r.card.isNew?'NEW！ ':''}${r.card.name} ×1${r.card.limitUp?` / ★${r.card.limitUp}`:''}${r.card.converted?` / MAX還元 +${r.card.refund}C`:''}`);
    if(!r.card)parts.push('専用カード：DROPなし');
    if(r.dungeon==='crystal'&&!r.crystal)parts.push('限界結晶：DROPなし');
    return parts;
  }
  function restoreTowerAfterDungeon(){
    if(!dungeonRun)return;
    const prev=dungeonRun.prev;
    state.battleMode=prev.mode;state.replayFloor=prev.replayFloor;
    if(Number.isFinite(prev.replayBlockStart))state.replayBlockStart=prev.replayBlockStart;
  }
  function finishDungeonRun(win){
    if(!dungeonRun)return;
    const run=dungeonRun,cfg=DUNGEONS[run.id],diff=DUNGEON_DIFF[run.diff];
    let reward=null;
    if(win){
      reward=dungeonReward(run.id,run.diff);state.dungeonWins=(Number(state.dungeonWins)||0)+1;
      state.dungeonClears[run.id][run.diff]=(Number(state.dungeonClears[run.id][run.diff])||0)+1;
      state.lastDungeonResult={win:true,name:cfg.name,diff:diff.label,lines:dungeonResultText(reward),at:Date.now()};
    }else state.lastDungeonResult={win:false,name:cfg.name,diff:diff.label,lines:['探索失敗。ダンジョンキーは消費済み。'],at:Date.now()};
    restoreTowerAfterDungeon();dungeonRun=null;save();
    try{updateStats();renderCollection();renderTeam();renderBattle()}catch(e){console.warn('v49 dungeon finish render',e)}
    renderDungeon();switchToView('dungeon');
  }
  function startDungeonRun(id=state.dungeonSelected,diff=state.dungeonDifficulty){
    ensureDungeonState();
    const cfg=DUNGEONS[id],d=DUNGEON_DIFF[diff];if(!cfg||!d)return;
    if((state.bestFloor||0)<25){alert('無限の塔25F突破でダンジョンが解禁されます。');return}
    if((state.bestFloor||0)<d.unlock){alert(`${d.label}は無限の塔${d.unlock}F突破で解禁されます。`);return}
    if((state.dungeonKeys||0)<1){alert('ダンジョンキーがありません。無限の塔で低確率DROPを狙ってください。');return}
    if(state.team.length!==3){alert('編成を3枚揃えてください。');return}
    if(battleBusy||autoBattleRunning||dungeonRun)return;
    state.dungeonKeys--;state.dungeonRuns=(Number(state.dungeonRuns)||0)+1;
    dungeonRun={id,diff,stage:1,buffs:[],awaitingBuff:false,prev:{mode:state.battleMode,replayFloor:state.replayFloor,replayBlockStart:Number(state.replayBlockStart)}};
    state.battleMode='replay';state.replayFloor=1;save();
    switchToView('battle');renderBattle();
  }
  function chooseDungeonBuff(kind){
    if(!dungeonRun||!dungeonRun.awaitingBuff)return;
    if(!['atk','hp','ult'].includes(kind))return;
    dungeonRun.buffs.push(kind);dungeonRun.awaitingBuff=false;
    switchToView('battle');renderBattle();
  }

  const originalStartBattleV49=startBattle;
  startBattle=async function(opts={}){
    if(dungeonRun?.awaitingBuff)return;
    const beforeBest=Number(state.bestFloor)||0,wasDungeon=!!dungeonRun;
    const outcome=await originalStartBattleV49(opts);
    if(!outcome)return outcome;
    if(wasDungeon&&dungeonRun){
      const stage=Number(outcome.floor)||dungeonRun.stage;
      if(!outcome.win){finishDungeonRun(false);return outcome}
      dungeonRun.stage=stage+1;
      if(stage>=5){finishDungeonRun(true);return outcome}
      if(stage===2||stage===4){dungeonRun.awaitingBuff=true;renderDungeon();switchToView('dungeon');return outcome}
      renderBattle();return outcome;
    }

    ensureDungeonState();
    if(outcome.win&&(state.bestFloor||0)>=25){
      let gained=0;
      const floor=Number(outcome.floor)||1;
      if(floor>=30&&floor%5===0&&beforeBest<floor&&(state.bestFloor||0)>=floor)gained++;
      const chance=floor%5===0?.015:.0005;
      if(Math.random()<chance)gained++;
      if(gained){state.dungeonKeys+=gained;save();logBattle?.(`ダンジョンキー DROP！ +${gained}（所持 ${state.dungeonKeys}）`,'logSkill');const br=document.getElementById('battleResult');if(br)br.textContent+=` / KEY +${gained}`}
    }
    if(beforeBest<25&&(state.bestFloor||0)>=25){
      ensureDungeonState();setTimeout(()=>alert(`ダンジョン解禁！\n初回支給：ダンジョンキー ×3\nNORMALに挑戦できます。`),150);
    }
    renderDungeon();return outcome;
  };
