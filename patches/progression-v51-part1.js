// v51: dedicated artwork for dungeon-exclusive cards.
(()=>{
  'use strict';

  const DUNGEON_ART={
    dg_midas:'images/dungeon/dg_midas.webp?v=51',
    dg_varga:'images/dungeon/dg_varga.webp?v=51',
    dg_crystalos:'images/dungeon/dg_crystalos.webp?v=51'
  };

  const originalCardImageV51=cardImage;
  cardImage=function(c){
    return DUNGEON_ART[c?.id]||originalCardImageV51(c);
  };

  try{
    renderCollection();
    renderTeam();
    if(document.getElementById('dungeon')?.classList.contains('active')&&typeof renderDungeon==='function')renderDungeon();
  }catch(e){console.warn('v51 dungeon art refresh failed',e)}
})();
