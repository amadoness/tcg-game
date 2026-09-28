// Team screen: tap an owned-card row to open the existing card detail viewer.
// Buttons inside the row keep their original actions.
document.addEventListener("DOMContentLoaded",()=>{
  const list=document.getElementById("teamCardList");
  if(!list)return;
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
});
