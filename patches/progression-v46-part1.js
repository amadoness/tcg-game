// v46: limit-break card requirements restored to the original curve.
// Limit Crystal cost now scales by card rarity instead.
(()=>{
  'use strict';

  const LIMIT_CRYSTAL_COST={
    C:1,UC:1,R:2,SR:3,SRP:4,
    SSR:5,SSRP:7,UR:10,URP:15,GOD:20
  };

  window.limitCrystalCost=function(cOrR){
    const rarity=typeof cOrR==='string'?cOrR:(cOrR?.r||'C');
    return LIMIT_CRYSTAL_COST[rarity]||1;
  };

  window.limitCrystalCostTable={...LIMIT_CRYSTAL_COST};

  // The previous rarity-based card-copy curve stored migration helpers only.
  // They are intentionally ignored now; the game's original LIMIT_COPY_THRESHOLDS
  // and original cardLimitRank/grantOwnedCopy behavior remain in effect.
  try{renderCollection();renderTeam();renderBattle();}catch(e){console.warn('v46 limit render refresh failed',e)}
})();
