// v49: dungeon system + dungeon-growth cards + selectable tower replay blocks.
(()=>{
  'use strict';

  const DUNGEON_LIMIT_THRESHOLDS=[1,2,3,4,6,8,11,14,18,23,30];
  const DUNGEON_CARD_IDS=new Set(['dg01','dg02','dg03']);
  const DUNGEON_DIFF={
    normal:{id:'normal',label:'NORMAL',unlock:25,enemyBase:1.08,cardDrop:.20,crystalDrop:.01},
    hard:{id:'hard',label:'HARD',unlock:40,enemyBase:1.28,cardDrop:.35,crystalDrop:.03},
    hell:{id:'hell',label:'HELL',unlock:60,enemyBase:1.50,cardDrop:.50,crystalDrop:.07}
  };
  const DUNGEONS={
    gold:{id:'gold',name:'黄金洞窟',desc:'COINを多く獲得できる洞窟。黄金巨像ミダスが待ち受ける。',bossId:'dg01',bossTitle:'黄金装甲',bossDesc:'高い耐久力を持つ黄金の守護巨像。',theme:'gold',
      enemies:[['c01','n2c05','u07'],['u07','r03','n2c05'],['r03','n2r02','n2r06'],['r03','n2r06','s06']],
      minions:['r03','n2r06']},
    training:{id:'training',name:'修練の遺跡',desc:'PLAYER EXP・熟練EXP・ULTIMATE EXPを多く獲得できる。',bossId:'dg02',bossTitle:'武神の試練',bossDesc:'攻撃に特化した古代の武神。',theme:'training',
      enemies:[['c03','u06','n2c01'],['u03','u06','r05'],['r05','s01','n2s01'],['s01','n2s01','n2r06']],
      minions:['s01','n2s01']},
    crystal:{id:'crystal',name:'結晶鉱山',desc:'超低確率で限界結晶を狙える鉱山。結晶獣クリスタロスが棲む。',bossId:'dg03',bossTitle:'晶殻領域',bossDesc:'結晶障壁で味方を守る支援型の魔獣。',theme:'crystal',
      enemies:[['c09','u04','n2c03'],['u04','r04','n2r03'],['r04','s03','n2s02'],['s03','n2r03','n2ss01']],
      minions:['r04','n2r03']}
  };
  let dungeonRun=null;

  function isDungeonCard(c){return !!c&&DUNGEON_CARD_IDS.has(c.id)}
  function dungeonRankByCount(count){
    let rank=0;
    for(let i=1;i<DUNGEON_LIMIT_THRESHOLDS.length;i++){if(count>=DUNGEON_LIMIT_THRESHOLDS[i])rank=i;else break}
    return Math.min(10,rank);
  }
  function ensureDungeonState(){
    if(!Number.isFinite(Number(state.dungeonKeys))||Number(state.dungeonKeys)<0)state.dungeonKeys=0;
    if(!state.dungeonClears||typeof state.dungeonClears!=='object'||Array.isArray(state.dungeonClears))state.dungeonClears={};
    for(const id of Object.keys(DUNGEONS))if(!state.dungeonClears[id]||typeof state.dungeonClears[id]!=='object')state.dungeonClears[id]={};
    if(!state.dungeonSelected||!DUNGEONS[state.dungeonSelected])state.dungeonSelected='gold';
    if(!DUNGEON_DIFF[state.dungeonDifficulty])state.dungeonDifficulty='normal';
    if(!Number.isFinite(Number(state.dungeonRuns))||Number(state.dungeonRuns)<0)state.dungeonRuns=0;
    if(!Number.isFinite(Number(state.dungeonWins))||Number(state.dungeonWins)<0)state.dungeonWins=0;
    if((state.bestFloor||0)>=25&&!state.dungeonUnlockGranted){state.dungeonKeys+=3;state.dungeonUnlockGranted=true;save()}
  }
  ensureDungeonState();

  const originalCardLimitRankV49=cardLimitRank;
  cardLimitRank=function(c){
    if(isDungeonCard(c)&&c._dungeonEnemy)return 0;
    if(isDungeonCard(c))return dungeonRankByCount(Number(state.counts[c.id]||0));
    return originalCardLimitRankV49(c);
  };
  const originalLimitProgressTextV49=limitProgressText;
  limitProgressText=function(c){
    if(!isDungeonCard(c))return originalLimitProgressTextV49(c);
    const count=Number(state.counts[c.id]||0),rank=cardLimitRank(c);
    if(count<=0)return '未所持';
    if(rank>=10)return `★10 MAX / 所持${count}枚 / ダンジョン育成完成（累計30枚） / 以降 +${limitRefundCoins(c).toLocaleString()} COIN`;
    const need=DUNGEON_LIMIT_THRESHOLDS[rank+1];
    return `所持${count}枚 / ★${rank+1}まであと${Math.max(0,need-count)}枚（必要${need}枚 / ★10累計30枚）`;
  };
  const originalGrantOwnedCopyV49=grantOwnedCopy;
  grantOwnedCopy=function(c){
    if(!isDungeonCard(c))return originalGrantOwnedCopyV49(c);
    const before=Number(state.counts[c.id]||0),beforeLimit=cardLimitRank(c),cap=30;
    if(before>=cap){
      const refund=limitRefundCoins(c);state.coins=(state.coins||0)+refund;
      return {before,after:before,beforeLimit,afterLimit:beforeLimit,isNew:false,limitUp:0,converted:true,refund};
    }
    const after=before+1;state.counts[c.id]=after;const afterLimit=cardLimitRank(c);
    return {before,after,beforeLimit,afterLimit,isNew:before===0,limitUp:afterLimit>beforeLimit?afterLimit:0,converted:false,refund:0};
  };
  window.cardLimitMaxCopies=function(c){return isDungeonCard(c)?30:LIMIT_COPY_THRESHOLDS[MAX_LIMIT_RANK]};
  window.cardLimitThresholds=function(c){return isDungeonCard(c)?[...DUNGEON_LIMIT_THRESHOLDS]:[...LIMIT_COPY_THRESHOLDS]};
  window.isDungeonCard=isDungeonCard;

  const originalGetBattleStatsV49=getBattleStats;
  getBattleStats=function(c,scale=1,useLimit=true){
    const s=originalGetBattleStatsV49(c,scale,useLimit);
    if(isDungeonCard(c)&&useLimit){
      const rank=cardLimitRank(c),m=.88+rank*.017;
      s.hp=Math.round(s.hp*m);s.atk=Math.round(s.atk*m);s.def=Math.round(s.def*m);s.spd=Math.round(s.spd*m);
      s.dungeonGrowth=m;
    }
    if(dungeonRun&&useLimit){
      const atk=dungeonRun.buffs.filter(x=>x==='atk').length;
      const hp=dungeonRun.buffs.filter(x=>x==='hp').length;
      if(atk)s.atk=Math.round(s.atk*(1+.10*atk));
      if(hp)s.hp=Math.round(s.hp*(1+.15*hp));
    }
    return s;
  };

  const originalGetPassiveV49=getPassive;
  getPassive=function(c){
    if(!isDungeonCard(c))return originalGetPassiveV49(c);
    const r=cardLimitRank(c);
    if(c.id==='dg01')return r>=8?{name:'黄金装甲・真',desc:'被ダメージ-8%。★8で完成する強化パッシブ。',damageTaken:.08}:{name:'黄金装甲',desc:'被ダメージ-3%。★8で-8%へ強化。',damageTaken:.03};
    if(c.id==='dg02')return r>=8?{name:'武の研鑽・極',desc:'攻撃+7%・素早さ+3%。',selfAtk:.07,selfSpd:.03}:{name:'武の研鑽',desc:'攻撃+2%。★8で攻撃+7%・素早さ+3%。',selfAtk:.02};
    if(c.id==='dg03')return r>=8?{name:'晶殻・真',desc:'最大HP+6%・防御+5%。',selfHp:.06,selfDef:.05}:{name:'晶殻',desc:'最大HP+2%。★8で最大HP+6%・防御+5%。',selfHp:.02};
    return originalGetPassiveV49(c);
  };

  const originalGetUniqueActiveV49=getUniqueActive;
  getUniqueActive=function(c){
    if(!isDungeonCard(c))return originalGetUniqueActiveV49(c);
    const r=cardLimitRank(c);
    if(c.id==='dg01')return r>=5?{name:'ゴールドクラッシュ・改',rate:.18,desc:'通常攻撃後18%で発動。単体へ0.55倍＋防御-10%。',dungeon:'midas',power:.55,defDown:.10}:{name:'ゴールドクラッシュ',rate:.17,desc:'通常攻撃後17%で発動。単体へ0.35倍＋防御-5%。★5で強化。',dungeon:'midas',power:.35,defDown:.05};
    if(c.id==='dg02')return r>=5?{name:'連環撃・三連',rate:.19,desc:'通常攻撃後19%で発動。単体へ0.22倍×3連撃。',dungeon:'valga',power:.22,hits:3}:{name:'連環撃',rate:.18,desc:'通常攻撃後18%で発動。単体へ0.18倍×2連撃。★5で強化。',dungeon:'valga',power:.18,hits:2};
    if(c.id==='dg03')return r>=5?{name:'結晶障壁・双',rate:.20,desc:'通常攻撃後20%で発動。HP割合の低い味方2体に最大HP8%シールド。',dungeon:'crystal',shield:.08,targets:2}:{name:'結晶障壁',rate:.19,desc:'通常攻撃後19%で発動。HP割合の低い味方1体に最大HP5%シールド。★5で強化。',dungeon:'crystal',shield:.05,targets:1};
    return null;
  };

  const originalGetUltimateV49=getUltimate;
  getUltimate=function(c){
    if(!isDungeonCard(c))return originalGetUltimateV49(c);
    const r=cardLimitRank(c);
    if(c.id==='dg01')return r>=10?{name:'王黄金撃・完成',condition:'hp50',conditionText:'自身HP50%以下',desc:'敵全体へ0.70倍＋自身に最大HP15%シールド。',dungeon:'midas'}:{name:'王黄金撃',condition:'hp50',conditionText:'自身HP50%以下',desc:'敵全体へ0.45倍。★10で威力・シールドが強化。',dungeon:'midas'};
    if(c.id==='dg02')return r>=10?{name:'武神千裂・完成',condition:'round3',conditionText:'3ラウンド目以降',desc:'単体へ0.32倍×3連撃＋防御10%無視。',dungeon:'valga'}:{name:'武神千裂',condition:'round3',conditionText:'3ラウンド目以降',desc:'単体へ0.60倍。★10で三連撃へ進化。',dungeon:'valga'};
    if(c.id==='dg03')return r>=10?{name:'クリスタル・サンクチュアリ・完成',condition:'allyLow50',conditionText:'味方の誰かがHP50%以下',desc:'味方全体HP10%回復＋最大HP10%シールド。',dungeon:'crystal'}:{name:'クリスタル・サンクチュアリ',condition:'allyLow50',conditionText:'味方の誰かがHP50%以下',desc:'味方全体HP5%回復。★10で回復量増加＋シールド。',dungeon:'crystal'};
    return null;
  };
