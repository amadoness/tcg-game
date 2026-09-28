// Team screen enhancements.
// 1) Tap an owned-card row to open the existing card detail viewer.
// 2) Remember the Team sort selection across reloads.
document.addEventListener("DOMContentLoaded",()=>{
  const list=document.getElementById("teamCardList");
  if(list){
    list.addEventListener("click",e=>{
      if(e.target.closest("button,select,input,label,a"))return;
      const row=e.target.closest(".teamPick");
      if(!row)return;
      const id=row.querySelector("[data-team-id]")?.dataset.teamId
        || row.querySelector("[data-team-fav]")?.dataset.teamFav;
      if(!id)return;
      const c=CARDS.find(x=>x.id===id);
      if(c)openCardViewer(c);
    });
  }

  const sortSelect=document.getElementById("teamSortSelect");
  if(!sortSelect)return;
  const valid=[...sortSelect.options].map(o=>o.value);

  if(valid.includes(state?.teamSortPreference)){
    sortSelect.value=state.teamSortPreference;
    renderTeam();
  }

  sortSelect.addEventListener("change",()=>{
    state.teamSortPreference=sortSelect.value;
    save();
  });
});

// Gacha safety: while a 1/10-pack reveal still has unopened cards,
// keep every purchase button locked so a new pull cannot overwrite the pending reveal.
(()=>{
  const purchaseIds=["singleBtn","tenBtn","hundredBtn","thousandBtn"];
  const hasPendingReveal=()=>(
    typeof currentPullCards!=="undefined" &&
    typeof currentRevealMode!=="undefined" &&
    currentRevealMode==="gacha" &&
    currentPullCards.length>0 &&
    currentPullCards.some(c=>!c._revealed)
  );

  const applyPurchaseLock=()=>{
    if(!hasPendingReveal())return;
    for(const id of purchaseIds){
      const el=document.getElementById(id);
      if(el)el.disabled=true;
    }
  };

  if(typeof updateStats==="function"){
    const originalUpdateStats=updateStats;
    updateStats=function(...args){
      const result=originalUpdateStats.apply(this,args);
      applyPurchaseLock();
      return result;
    };
  }

  for(const id of purchaseIds){
    const el=document.getElementById(id);
    if(!el)continue;
    el.addEventListener("click",e=>{
      if(!hasPendingReveal())return;
      e.preventDefault();
      e.stopImmediatePropagation();
      navigator.vibrate?.(25);
    },true);
  }

  // Initial sync in case the patch loads while a reveal is already active.
  applyPurchaseLock();
})();
