ed('mastery'))return [];
    return originalGrantBattleMastery(cardIds,win,floor);
  };

  const originalRollEquipmentDrop=rollEquipmentDrop;
  rollEquipmentDrop=function(floor){return floor>=V45.UNLOCK.equipment?originalRollEquipmentDrop(floor):null};
  const originalEquipmentEffect=equipmentEffect;
  equipmentEffect=function(cardOrId){return unlocked('equipment')?originalEquipmentEffect(cardOrId):{}};

  const originalBattleRewardInfo=battleRewardInfo;
  battleRewardInfo=function(floor=activeBattleFloor()){
    const x=originalBattleRewardInfo(floor),m=towerCoinMultiplier();
    if(m===1)return x;
    const base=Math.round(x.base*m/5)*5;
    const milestone=Math.round(x.milestone*m/5)*5;
    return {...x,base,milestone,total:base+milestone};
  };

  const originalLimitRefundCoins=limitRefundCoins;
  limitRefundCoins=function(c){return Math.round(originalLimitRefundCoins(c)*refundMultiplier())};

  const originalUltimateUses=ultimateUses;
  ultimateUses=function(c){return originalUltimateUses(c)};
  const originalUltimateLevelByUses=ultimateLevelByUses;
  ultimateLevel=function(c){return getUltimate(c)?(unlocked('ultimate')?originalUltimateLevelByUses(ultimateUses(c)):1):0};
  ultimateProgress=function(c){
    if(!getUltimate(c))return null;
    const exp=ultimateUses(c),lv=originalUltimateLevelByUses(exp);
    if(lv>=ULTIMATE_MAX_LEVEL)return {uses:exp,lv,pct:100,text:`必殺Lv10 MAX / EXP ${Math.floor(exp).toLocaleString()}`};
    const from=ULTIMATE_THRESHOLDS[lv-1],next=ULTIMATE_THRESHOLDS[lv];
    const pct=Math.max(0,Math.min(100,((exp-from)/(next-from))*100));
    return {uses:exp,lv,pct,text:`EXP ${Math.floor(exp).toLocaleString()} / ${next.toLocaleString()}（次Lvまで ${Math.max(0,Math.ceil(next-exp)).toLocaleString()}）`};
  };
  grantUltimateUse=function(c){
    ensureV45State();
    const before=ultimateUses(c),realBefore=originalUltimateLevelByUses(before);
    const add=ultimateExpMultiplier();
    const after=before+add;
    state.ultimateUses[c.id]=after;
    const realAfter=originalUltimateLevelByUses(after);
    if(!unlocked('ultimate'))return {before,after,beforeLevel:1,afterLevel:1,realBefore,realAfter};
    return {before,after,beforeLevel:realBefore,afterLevel:realAfter};
  };

  function masteryCap(){return Number(MASTERY_THRESHOLDS[MASTERY_MAX_LEVEL-1]||5000)}
  function addMasteryExp(card,amount){
    if(!card||amount<=0)return null;
    const before=masteryExp(card),beforeLevel=masteryLevelByExp(before);
    const after=Math.min(masteryCap(),before+amount);
    state.masteryExp[card.id]=after;
    const afterLevel=masteryLevelByExp(after);
    return {card,before,after,beforeLevel,afterLevel,added:after-before};
  }
  function addUltimateExp(card,amount){
    if(!card||!getUltimate(card)||amount<=0)return null;
    const before=ultimateUses(card),beforeLevel=originalUltimateLevelByUses(before);
    const after=before+amount;state.ultimateUses[card.id]=after;
    return {card,before,after,beforeLevel,afterLevel:originalUltimateLevelByUses(after),added:amount};
  }

  function rollConsumable(floor){
    if(!unlocked('items'))return null;
    const boss=floor%5===0;
    const chance=(boss?.002:.0002)*itemDropMultiplier();
    if(Math.random()>=chance)return null;
    const pool=unlocked('ultimate')
      ?[['masteryBook',.50],['ultimateBook',.35],['limitCrystal',.15]]
      :[['masteryBook',.70],['limitCrystal',.30]];
    let r=Math.random(),acc=0,id=pool[pool.length-1][0];
    for(const [key,w] of pool){acc+=w;if(r<acc){id=key;break}}
    state.consumables[id]=(Number(state.consumables[id])||0)+1;
    state.itemDrops=(Number(state.itemDrops)||0)+1;
    return {id,...V45.ITEMS[id]};
  }

  function v45Css(){
    const s=document.createElement('style');
    s.textContent=`
      .v45Player{margin:8px 0 10px;padding:9px 11px;border:1px solid #30394d;background:#0b0f17;border-radius:12px;display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center}
      .v45Player b{font-size:12px;color:#ffe49b}.v45Player small{font-size:9px;color:#97a4b8}.v45Bar{height:7px;border:1px solid #27344b;background:#111826;border-radius:99px;overflow:hidden}.v45Bar>i{display:block;height:100%;background:linear-gradient(90deg,#5b8cff,#b86cff,#ffe06c)}
      .v45ItemsGrid,.v45TreasureGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:9px}.v45Item,.v45Treasure{border:1px solid #2b3446;background:#0a0e15;border-radius:13px;padding:11px}.v45Treasure.locked{opacity:.38;filter:grayscale(.7)}.v45Item h4,.v45Treasure h4{margin:0 0 5px;font-size:12px}.v45Item p,.v45Treasure p{margin:0;color:#9ca9bc;font-size:9px;line-height:1.5}.v45Item select,.v45Training select{width:100%;margin-top:7px;border:1px solid #35405a;background:#101520;color:#eef3ff;border-radius:9px;padding:8px;font-size:10px}.v45Item button{width:100%;margin-top:7px;border:1px solid #6c5530;background:#2b2111;color:#ffe4a7;border-radius:9px;padding:8px;font-weight:900}.v45Item button:disabled{opacity:.35}.v45ItemCount{float:right;color:#ffe08a}.v45Training{margin-top:10px;padding:10px;border:1px solid #33415a;border-radius:12px;background:#0b111b}.v45Training b{font-size:11px;color:#abd0ff}.v45Training p{font-size:9px;color:#97a4b8}.v45TrainingSlots{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}@media(max-width:560px){.v45TrainingSlots{grid-template-columns:1fr}}
      .v45StatsToggle{width:100%;margin:8px 0 0;border:1px solid #46536b;background:#121a28;color:#dce8ff;border-radius:10px