// v46: rarity-scaled limit-break requirements + save-compatible migration.
(()=>{
  'use strict';

  const BASE_LIMIT_THRESHOLDS=[1,2,4,7,11,16,32,64,128,256,512];
  const LIMIT_RARITY_FACTOR={
    C:1.00,UC:1.05,R:1.10,SR:1.15,SRP:1.20,
    SSR:1.30,SSRP:1.40,UR:1.50,URP:1.60,GOD:1.80
  };
  const legacyCardLimitRank=cardLimitRank;

  function ensureLimitV46State(){
    if(!state.limitRankFloor||typeof state.limitRankFloor!=='object'||Array.isArray(state.limitRankFloor))state.limitRankFloor={};
    if(!state.limitCurveV46Migrated){
      for(const c of CARDS){
        if((state.counts[c.id]||0)>0)state.limitRankFloor[c.id]=legacyCardLimitRank(c);
      }
      state.limitCurveV46Migrated=1;
      save();
    }
  }

  function thresholdsFor(cOrR){
    const rarity=typeof cOrR==='string'?cOrR:(cOrR?.r||'C');
    const factor=LIMIT_RARITY_FACTOR[rarity]||1;
    return BASE_LIMIT_THRESHOLDS.map((n,i)=>i===0?1:1+Math.round((n-1)*factor));
  }
  function rankFor(c,count){
    const t=thresholdsFor(c);
    let rank=0;
    for(let i=1;i<t.length;i++){
      if(count>=t[i])rank=i;
      else break;
    }
    return Math.min(MAX_LIMIT_RANK,rank);
  }
  function maxCopies(c){return thresholdsFor(c)[MAX_LIMIT_RANK]}

  ensureLimitV46State();

  window.cardLimitThresholds=thresholdsFor;
  window.cardLimitMaxCopies=maxCopies;

  cardLimitRank=function(c){
    ensureLimitV46State();
    const calculated=rankFor(c,Number(state.counts[c.id]||0));
    const preserved=Math.max(0,Math.min(MAX_LIMIT_RANK,Number(state.limitRankFloor[c.id]||0)));
    return Math.max(calculated,preserved);
  };

  limitProgressText=function(c){
    const count=Number(state.counts[c.id]||0),rank=cardLimitRank(c),t=thresholdsFor(c);
    if(count<=0)return '未所持';
    if(rank>=MAX_LIMIT_RANK)return `★10 MAX / 所持${count}枚 / 最大必要${t[MAX_LIMIT_RANK]}枚 / 以降の排出は +${limitRefundCoins(c).toLocaleString()} COIN`;
    const need=t[rank+1];
    return `所持${count}枚 / ★${rank+1}まであと${Math.max(0,need-count)}枚（必要${need}枚）`;
  };

  grantOwnedCopy=function(c){
    ensureLimitV46State();
    const before=Number(state.counts[c.id]||0),beforeLimit=cardLimitRank(c),cap=maxCopies(c);
    if(before>=cap){
      const refund=limitRefundCoins(c);
      state.coins=(state.coins||0)+refund;
      return {before,after:before,beforeLimit,afterLimit:beforeLimit,isNew:false,limitUp:0,converted:true,refund};
    }
    const after=before+1;
    state.counts[c.id]=after;
    const afterLimit=cardLimitRank(c);
    return {before,after,beforeLimit,afterLimit,isNew:before===0,limitUp:afterLimit>beforeLimit?afterLimit:0,converted:false,refund:0};
  };

  migrateLimit10Excess=function(){
    ensureLimitV46State();
    let refund=0,excess=0;
    for(const c of CARDS){
      const count=Number(state.counts[c.id]||0),cap=maxCopies(c);
      if(count>cap){
        const over=count-cap;
        state.counts[c.id]=cap;
        excess+=over;
        refund+=over*limitRefundCoins(c);
      }
    }
    if(refund>0)state.coins=(state.coins||0)+refund;
    state.limit10Migrated=true;
    return {excess,refund};
  };

  // Make the new rarity curve immediately visible anywhere limit progress is shown.
  try{renderCollection();renderTeam();renderBattle();}catch(e){console.warn('v46 limit render refresh failed',e)}
})();
