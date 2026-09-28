{f,title,text,k})};
    add(3,'限界突破 解禁','重複カードによる限界突破が有効になりました。集めた★に応じてカード能力が上昇します。');
    add(5,'熟練度 解禁','戦闘参加カードが勝利時に熟練EXPを獲得するようになりました。');
    add(8,'装備システム 解禁','塔の勝利時に装備がDROPするようになりました。「装備」タブも解禁されます。');
    add(10,'秘宝・アイテム 解禁','永久秘宝「熟練の護符」を獲得。育成枠3枚に熟練EXPの1/3が入ります。消費アイテムも超低確率でDROP開始。');
    add(15,'ULTIMATE強化・周回機能 解禁','永久秘宝「奥義の指南書」を獲得。必殺LvとULTIMATE EXPが解禁され、獲得EXPが+20%。前ブロック周回とAUTO連戦も使用可能になります。');
    add(20,'永久秘宝：黄金の財布','塔のCOIN獲得量が+10%になります。','TREASURE GET');
    add(25,'永久秘宝：収集家の紋章','★10カード重複時のCOIN還元が+15%になります。','TREASURE GET');
    add(30,'永久秘宝：修練の宝珠','育成枠への熟練EXPが1/3から40%へ強化されます。','TREASURE GET');
    add(35,'永久秘宝：冒険者の王冠','PLAYER EXP獲得量が+10%になります。','TREASURE GET');
    add(40,'永久秘宝：奥義の宝珠','ULTIMATE EXP獲得量がさらに+10%されます。','TREASURE GET');
    add(45,'永久秘宝：幸運の聖杯','超低確率の消費アイテムDROP率が1.25倍になります。','TREASURE GET');
    add(50,'永久秘宝：英雄の証','熟練EXP・ULTIMATE EXP・PLAYER EXPがすべて+5%されます。','TREASURE GET');
    return e;
  }

  const originalStartBattle=startBattle;
  startBattle=async function(opts={}){
    ensureV45State();const beforeBest=Number(state.bestFloor)||0;
    const outcome=await originalStartBattle(opts);
    if(!outcome)return outcome;
    refreshTreasures();
    if(outcome.win){
      const floor=Number(outcome.floor)||1;
      const pg=grantPlayerExp(playerExpGain(floor));
      logBattle?.(`PLAYER EXP +${pg.added}${pg.after>pg.before?` / PLAYER Lv.${pg.before} → ${pg.after}！`:''}`,'logSkill');

      if(unlocked('mastery')){
        const baseGain=floor%5===0?3:1,bonusMult=masteryBonusMultiplier();
        if(bonusMult>1){for(const id of state.team){const c=CARDS.find(x=>x.id===id);if(c)addMasteryExp(c,baseGain*(bonusMult-1))}}
        const share=reserveMasteryShare();
        if(share>0){
          let applied=0;
          for(const id of state.trainingSlots){if(!id||state.team.includes(id))continue;const c=CARDS.find(x=>x.id===id);if(!c||(state.counts[id]||0)<=0)continue;const r=addMasteryExp(c,baseGain*share*bonusMult);if(r?.added>0)applied++}
          if(applied)logBattle?.(`育成枠：${applied}枚に熟練EXPを${Math.round(share*100)}%付与`,'mutedLine');
        }
      }

      const drop=rollConsumable(floor);
      if(drop)logBattle?.(`超レアITEM DROP！「${drop.name}」`,'logSkill');
    }
    refreshTreasures();save();renderPlayerHud();updateFeatureLocks();
    try{renderTeam();renderBattle();renderCollection();}catch(e){console.warn('v45 post-battle render failed',e)}
    if(unlocked('items'))renderItems();
    for(const e of unlockEventsBetween(beforeBest,Number(state.bestFloor)||0))await unlockNotice(e.title,e.text,e.k);
    return outcome;
  };

  const originalSwitchToView=switchToView;
  switchToView=function(tabId,fromTutorial=false){
    if(tabId==='equipment'&&!unlocked('equipment'))return;
    if(tabId==='items'&&!unlocked('items'))return;
    originalSwitchToView(tabId,fromTutorial);
    if(tabId==='items')renderItems();
  };
  const originalApplyTutorialControls=applyTutorialControls;
  applyTutorialControls=function(){originalApplyTutorialControls();updateFeatureLocks()};
  const originalUpdateStats=updateStats;
  updateStats=function(...args){const r=originalUpdateStats.apply(this,args);renderPlayerHud();updateFeatureLocks();if(unlocked('items')&&document.getElementById('items')?.classList.contains('active'))renderItems();return r};

  const reset=document.getElementById('resetBtn');
  if(reset){const old=reset.onclick;reset.onclick=function(...args){const out=old?.apply(this,args);setTimeout(()=>{ensureV45State();renderPlayerHud();updateFeatureLocks();if(unlocked('items'))renderItems()},0);return out}}

  ensureV45State();buildV45Ui();renderPlayerHud();updateFeatureLocks();
  if(unlocked('items'))renderItems();
  save();
})();
