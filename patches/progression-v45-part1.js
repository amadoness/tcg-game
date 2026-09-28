// v45: staged feature unlocks, permanent treasures, rare consumables,
// player level (Lv1-1000), reserve mastery training, and base-stat viewer.
(()=>{
  'use strict';

  const V45={
    MAX_PLAYER_LEVEL:1000,
    UNLOCK:{limit:3,mastery:5,equipment:8,items:10,ultimate:15,auto:15,pack2:20},
    TREASURES:[
      {id:'masteryCharm',floor:10,name:'熟練の護符',desc:'育成枠3枚に、戦闘参加カードの熟練EXPの1/3を付与。'},
      {id:'ultimateGuide',floor:15,name:'奥義の指南書',desc:'ULTIMATE EXP獲得量 +20%。'},
      {id:'goldWallet',floor:20,name:'黄金の財布',desc:'塔のCOIN獲得量 +10%。'},
      {id:'collectorCrest',floor:25,name:'収集家の紋章',desc:'★10カード重複時のCOIN還元 +15%。'},
      {id:'trainingOrb',floor:30,name:'修練の宝珠',desc:'育成枠の熟練EXPを1/3から40%へ強化。'},
      {id:'adventurerCrown',floor:35,name:'冒険者の王冠',desc:'PLAYER EXP獲得量 +10%。'},
      {id:'ultimateOrb',floor:40,name:'奥義の宝珠',desc:'ULTIMATE EXP獲得量をさらに +10%。'},
      {id:'luckyGrail',floor:45,name:'幸運の聖杯',desc:'超低確率の消費アイテムDROP率 ×1.25。'},
      {id:'heroProof',floor:50,name:'英雄の証',desc:'熟練EXP・ULTIMATE EXP・PLAYER EXPを各 +5%。'}
    ],
    ITEMS:{
      masteryBook:{name:'熟練の書',desc:'指定カードの熟練EXP +500。'},
      ultimateBook:{name:'奥義経験書',desc:'指定カードのULTIMATE EXP +1000。'},
      limitCrystal:{name:'限界結晶',desc:'指定カードに限界突破素材1枚分を付与。'}
    }
  };

  function ensureV45State(){
    if(!state.treasures||typeof state.treasures!=='object'||Array.isArray(state.treasures))state.treasures={};
    if(!state.consumables||typeof state.consumables!=='object'||Array.isArray(state.consumables))state.consumables={};
    for(const id of Object.keys(V45.ITEMS))if(!Number.isFinite(Number(state.consumables[id])))state.consumables[id]=0;
    if(!Array.isArray(state.trainingSlots))state.trainingSlots=[];
    state.trainingSlots=state.trainingSlots.filter(id=>CARDS.some(c=>c.id===id)).slice(0,3);
    while(state.trainingSlots.length<3)state.trainingSlots.push('');
    if(!Number.isFinite(Number(state.playerExp))||Number(state.playerExp)<0)state.playerExp=0;
    if(!Number.isFinite(Number(state.itemDrops))||Number(state.itemDrops)<0)state.itemDrops=0;
    refreshTreasures();
  }
  function refreshTreasures(){
    const best=Number(state.bestFloor)||0;
    for(const t of V45.TREASURES)if(best>=t.floor)state.treasures[t.id]=true;
  }
  function unlocked(key){return (Number(state.bestFloor)||0)>=(V45.UNLOCK[key]||Infinity)}
  function hasTreasure(id){ensureV45State();return !!state.treasures[id]}

  const PLAYER_NEED=Array(V45.MAX_PLAYER_LEVEL+1).fill(0);
  const PLAYER_TOTAL=Array(V45.MAX_PLAYER_LEVEL+1).fill(0);
  for(let lv=1;lv<V45.MAX_PLAYER_LEVEL;lv++){
    PLAYER_NEED[lv]=Math.round(300*Math.pow(lv,1.35)+200*Math.pow(lv,1.05));
    PLAYER_TOTAL[lv+1]=PLAYER_TOTAL[lv]+PLAYER_NEED[lv];
  }
  function playerLevelFromExp(exp){
    exp=Math.max(0,Number(exp)||0);
    let lo=1,hi=V45.MAX_PLAYER_LEVEL;
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(PLAYER_TOTAL[mid]<=exp)lo=mid;else hi=mid-1}
    return lo;
  }
  function playerProgress(){
    ensureV45State();
    const exp=Number(state.playerExp)||0,lv=playerLevelFromExp(exp);
    if(lv>=V45.MAX_PLAYER_LEVEL)return {lv,exp,pct:100,text:'MAX',into:0,need:0};
    const into=exp-PLAYER_TOTAL[lv],need=PLAYER_NEED[lv];
    return {lv,exp,into,need,pct:Math.max(0,Math.min(100,into/need*100)),text:`${Math.floor(into).toLocaleString()} / ${need.toLocaleString()}`};
  }
  function playerStatBonus(){return Math.max(0,playerProgress().lv-1)*.001}
  function playerExpMultiplier(){return 1+(hasTreasure('adventurerCrown')?.10:0)+(hasTreasure('heroProof')?.05:0)}
  function playerExpGain(floor){
    const base=Math.max(1,Math.round(5+floor*1.5+(floor%5===0?floor*.5:0)));
    return Math.max(1,Math.round(base*playerExpMultiplier()));
  }
  function grantPlayerExp(amount){
    ensureV45State();
    const before=playerProgress().lv;
    if(before>=V45.MAX_PLAYER_LEVEL)return {before,after:before,added:0};
    const cap=PLAYER_TOTAL[V45.MAX_PLAYER_LEVEL];
    const added=Math.max(0,Number(amount)||0);
    state.playerExp=Math.min(cap,(Number(state.playerExp)||0)+added);
    const after=playerProgress().lv;
    return {before,after,added};
  }

  function reserveMasteryShare(){return hasTreasure('trainingOrb')?.40:(hasTreasure('masteryCharm')?1/3:0)}
  function masteryBonusMultiplier(){return 1+(hasTreasure('heroProof')?.05:0)}
  function ultimateExpMultiplier(){return 1+(hasTreasure('ultimateGuide')?.20:0)+(hasTreasure('ultimateOrb')?.10:0)+(hasTreasure('heroProof')?.05:0)}
  function towerCoinMultiplier(){return hasTreasure('goldWallet')?1.10:1}
  function refundMultiplier(){return hasTreasure('collectorCrest')?1.15:1}
  function itemDropMultiplier(){return hasTreasure('luckyGrail')?1.25:1}

  const originalGetBattleStats=getBattleStats;
  getBattleStats=function(c,scale=1,useLimit=true){
    const s=originalGetBattleStats(c,scale,useLimit);
    if(useLimit){
      const m=1+playerStatBonus();
      s.hp=Math.round(s.hp*m);s.atk=Math.round(s.atk*m);s.def=Math.round(s.def*m);s.spd=Math.round(s.spd*m);
      s.playerLevel=playerProgress().lv;s.playerBonus=playerStatBonus();
    }
    return s;
  };

  const originalLimitStatMultiplier=limitStatMultiplier;
  limitStatMultiplier=function(c){return unlocked('limit')?originalLimitStatMultiplier(c):1};

  const originalMasteryStatBonus=masteryStatBonus;
  masteryStatBonus=function(c){return unlocked('mastery')?originalMasteryStatBonus(c):0};

  const originalGrantBattleMastery=grantBattleMastery;
  grantBattleMastery=function(cardIds,win,floor){
    if(!unlock