// v49: permanent dungeon system with rare keys, 5-battle expeditions,
// exploration buffs, dungeon-exclusive cards and progression-based skills.
(()=>{
  'use strict';

  const DUNGEON_UNLOCK_FLOOR=25;
  const DUNGEON_KEY_NORMAL_RATE=.0005; // 0.05%
  const DUNGEON_KEY_BOSS_RATE=.02;     // 2.0%
  const DUNGEON_CARD_THRESHOLDS=[1,2,3,4,6,8,11,14,18,23,30];
  const DUNGEON_LIMIT_BONUS=[0,.02,.04,.06,.08,.12,.145,.17,.20,.225,.25];
  const DUNGEON_CARD_IDS=new Set(['dg_midas','dg_varga','dg_crystalos']);

  const DUNGEON_CARDS=[
    {id:'dg_midas',r:'R',name:'黄金巨像ミダス',theme:'earth',set:0,source:'dungeon',dungeon:'gold'},
    {id:'dg_varga',r:'R',name:'古代武神ヴァルガ',theme:'sword',set:0,source:'dungeon',dungeon:'training'},
    {id:'dg_crystalos',r:'R',name:'結晶獣クリスタロス',theme:'holy',set:0,source:'dungeon',dungeon:'crystal'}
  ];
  for(const c of DUNGEON_CARDS)if(!CARDS.some(x=>x.id===c.id))CARDS.push(c);

  const DUNGEONS={
    gold:{
      id:'gold',name:'黄金洞窟',tag:'COINを大量獲得',desc:'黄金に満ちた洞窟。5戦を突破してCOINと専用カードを狙う。',bossId:'dg_midas',bossName:'黄金巨像ミダス',accent:'#e4aa3a',
      pool:['c01','u07','r03','n2c05','n2u07','n2r02','n2s06'],
      rewards:{
        normal:{coin:[500,700],card:.20,crystal:0,player:25,mastery:0,ultimate:0},
        hard:{coin:[900,1200],card:.35,crystal:0,player:45,mastery:0,ultimate:0},
        hell:{coin:[1500,2000],card:.50,crystal:0,player:80,mastery:0,ultimate:0}
      }
    },
    training:{
      id:'training',name:'修練の遺跡',tag:'育成EXPを大量獲得',desc:'古代の武人が眠る修練場。PLAYER・熟練・ULTIMATE EXPをまとめて鍛える。',bossId:'dg_varga',bossName:'古代武神ヴァルガ',accent:'#78a9ff',
      pool:['c03','u06','r05','s01','s05','n2c01','n2u02','n2s01','n2s03'],
      rewards:{
        normal:{coin:[100,150],card:.20,crystal:0,player:150,mastery:10,ultimate:30},
        hard:{coin:[200,300],card:.35,crystal:0,player:350,mastery:20,ultimate:70},
        hell:{coin:[350,500],card:.50,crystal:0,player:700,mastery:40,ultimate:150}
      }
    },
    crystal:{
      id:'crystal',name:'結晶鉱山',tag:'限界結晶を狙う',desc:'希少な魔力結晶が眠る鉱山。限界結晶は非常に低確率だが、ここで狙える。',bossId:'dg_crystalos',bossName:'結晶獣クリスタロス',accent:'#8e75ff',
      pool:['c02','u02','r07','n2c02','n2u03','n2r03','n2s02'],
      rewards:{
        normal:{coin:[150,250],card:.20,crystal:.01,player:30,mastery:0,ultimate:0},
        hard:{coin:[300,450],card:.35,crystal:.03,player:55,mastery:0,ultimate:0},
        hell:{coin:[500,700],card:.50,crystal:.07,player:90,mastery:0,ultimate:0}
      }
    }
  };

  const DIFFICULTIES={
    normal:{id:'normal',label:'NORMAL',floor:25,baseFloor:25,enemyMult:1.00},
    hard:{id:'hard',label:'HARD',floor:40,baseFloor:40,enemyMult:1.03},
    hell:{id:'hell',label:'HELL',floor:60,baseFloor:60,enemyMult:1.07}
  };

  const BUFFS=[
    {id:'atk',name:'攻撃力 +10%',desc:'探索中、味方全員の攻撃力+10%。'},
    {id:'hp',name:'最大HP +15%',desc:'探索中、味方全員の最大HP+15%。'},
    {id:'def',name:'防御力 +10%',desc:'探索中、味方全員の防御力+10%。'},
    {id:'spd',name:'素早さ +10%',desc:'探索中、味方全員の素早さ+10%。'},
    {id:'active',name:'ACTIVE +3pt',desc:'探索中、味方全員のACTIVE発動率+3ポイント。'},
    {id:'ult',name:'ULTIMATE威力 +15%',desc:'探索中、味方全員のULTIMATE威力+15%。'}
  ];

  let selectedDungeon='gold';
  let selectedDifficulty='normal';
  let dungeonRun=null;
  let lastDungeonResult=null;

  function isDungeonCard(c){return !!c&&DUNGEON_CARD_IDS.has(c.id)}
  function dungeonSkillRank(c){return Math.max(0,Math.min(10,Number(c?._dungeonRank??cardLimitRank(c))||0))}
  function difficultyUnlocked(id){return (Number(state.bestFloor)||0)>=DIFFICULTIES[id].floor}
  function dungeonUnlocked(){return (Number(state.bestFloor)||0)>=DUNGEON_UNLOCK_FLOOR}
  function randomStep5(min,max){return Math.round((min+Math.random()*(max-min))/5)*5}
  function dungeonCardById(id){return CARDS.find(c=>c.id===id)}
  function formatPct(n){return `${(n*100).toFixed(n*100<1?1:0)}%`}

  function ensureDungeonState(){
    if(!Number.isFinite(Number(state.dungeonKeys))||Number(state.dungeonKeys)<0)state.dungeonKeys=0;
    if(!state.dungeonClears||typeof state.dungeonClears!=='object'||Array.isArray(state.dungeonClears))state.dungeonClears={};
    for(const id of Object.keys(DUNGEONS)){
      if(!state.dungeonClears[id]||typeof state.dungeonClears[id]!=='object')state.dungeonClears[id]={};
      for(const d of Object.keys(DIFFICULTIES))if(!Number.isFinite(Number(state.dungeonClears[id][d])))state.dungeonClears[id][d]=0;
    }
    if(!state.dungeonKeyMilestones||typeof state.dungeonKeyMilestones!=='object')state.dungeonKeyMilestones={};
    if(Number(state.dungeonPendingKeyRefund)>0){
      state.dungeonKeys+=Number(state.dungeonPendingKeyRefund)||0;
      state.dungeonPendingKeyRefund=0;
    }
    if(dungeonUnlocked()&&!state.dungeonInitialKeysGranted){
      state.dungeonInitialKeysGranted=true;
      state.dungeonKeys+=3;
    }
  }

  // Dungeon cards use a compact 30-copy ★10 curve.
  const originalCardLimitRankV49=cardLimitRank;
  cardLimitRank=function(c){
    if(!isDungeonCard(c))return originalCardLimitRankV49(c);
    const count=Math.max(0,Number(state.counts[c.id]||0));
    let rank=0;
    for(let i=1;i<DUNGEON_CARD_THRESHOLDS.length;i++){if(count>=DUNGEON_CARD_THRESHOLDS[i])rank=i;else break}
    return Math.min(MAX_LIMIT_RANK,rank);
  };

  const originalLimitStatBonusV49=limitStatBonus;
  limitStatBonus=function(c,rank=cardLimitRank(c)){
    if(!isDungeonCard(c))return originalLimitStatBonusV49(c,rank);
    return DUNGEON_LIMIT_BONUS[Math.max(0,Math.min(10,Number(rank)||0))]||0;
  };

