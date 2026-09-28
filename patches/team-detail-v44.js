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
