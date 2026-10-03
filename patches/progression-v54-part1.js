// v54: gold dungeon economy rebalance.
// First clear per difficulty gives a meaningful burst; repeat clears support 1-3 pulls instead of mass gacha farming.
(()=>{
  'use strict';

  const RULES={
    normal:{first:3000,repeat:[300,600]},
    hard:{first:4500,repeat:[450,750]},
    hell:{first:6000,repeat:[600,900]}
  };

  window.V54GoldDungeonReward=function(diffId,clearCount=0){
    const rule=RULES[diffId]||RULES.normal;
    const firstClear=Number(clearCount)<=0;
    return {
      coin:firstClear?[rule.first,rule.first]:rule.repeat,
      first:rule.first,
      repeat:[...rule.repeat],
      firstClear
    };
  };
})();