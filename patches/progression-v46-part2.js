// v46: use rare consumable items directly from the Team screen.
(()=>{
  'use strict';

  function itemsUnlocked(){return Number(state.bestFloor||0)>=10}
  function ultimateItemsUnlocked(){return Number(state.bestFloor||0)>=15}
  function crystalCost(card){return typeof limitCrystalCost==='function'?limitCrystalCost(card):1}
  function ensureConsumables(){
    if(!state.consumables||typeof state.consumables!=='object'||Array.isArray(state.consumables))state.consumables={};
    for(const id of ['masteryBook','ultimateBook','limitCrystal'])if(!Number.isFinite(Number(state.consumables[id])))state.consumables[id]=0;
  }
  function injectCss(){
    if(document.getElementById('v46TeamItemCss'))return;
    const s=document.createElement('style');s.id='v46TeamItemCss';s.textContent=`
      .v46UseItemBtn{border-color:#8a6a2c!important;background:#2a210d!important;color:#ffe8a5!important}
      .slotQuickActions.v46Three{grid-template-columns:repeat(3,1fr)}
      .v46ItemModal{display:none;position:fixed;inset:0;z-index:100000;background:#02050ae8;align-items:center;justify-content:center;padding:16px}
      .v46ItemModal.show{display:flex}
      .v46ItemCard{width:min(94vw,480px);max-height:84vh;overflow:auto;border:1px solid #4d5a72;border-radius:16px;background:#0a0f18;padding:16px;box-shadow:0 20px 60px #000a}
      .v46ItemHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.v46ItemHead h3{margin:0;font-size:16px}.v46ItemClose{border:1px solid #414d63;background:#111927;color:#e9efff;border-radius:9px;padding:7px 10px;font-weight:900}
      .v46ItemRow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #273247;background:#0d1420;border-radius:12px;padding:11px;margin-top:8px}.v46ItemRow b{display:block;font-size:11px;color:#ffe6a6}.v46ItemRow p{margin:4px 0 0;font-size:9px;line-height:1.5;color:#9fadc2}.v46ItemRow button{min-width:82px;border:1px solid #7b6030;background:#2d2210;color:#ffe6a6;border-radius:9px;padding:8px;font-weight:1000}.v46ItemRow button:disabled{opacity:.35}
      .v46ItemCount{font-size:10px;color:#ffd76d;margin-left:6px}
      @media(max-width:520px){.slotQuickActions.v46Three{grid-template-columns:repeat(3,1fr)}.v46ItemRow{grid-template-columns:1fr}.v46ItemRow button{width:100%}}
    `;document.head.appendChild(s);
  }
  function buildModal(){
    injectCss();
    if(document.getElementById('v46ItemModal'))return;
    const o=document.createElement('div');o.id='v46ItemModal';o.className='v46ItemModal';o.innerHTML=`
      <div class="v46ItemCard">
        <div class="v46ItemHead"><h3 id="v46ItemCardName">アイテム使用</h3><button class="v46ItemClose" id="v46ItemClose">閉じる</button></div>
        <div class="hint">このカードに使用するアイテムを選択してください。</div>
        <div id="v46ItemRows"></div>
      </div>`;
    document.body.appendChild(o);
    document.getElementById('v46ItemClose').onclick=()=>o.classList.remove('show');
    o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show')});
  }
  function consume(card,id){
    ensureConsumables();
    const need=id==='limitCrystal'?crystalCost(card):1;
    if((state.consumables[id]||0)<need){if(id==='limitCrystal')alert(`限界結晶が足りません。\n${card.name}（${DISP[card.r]}）には ${need}個 必要です。`);return;}
    if(id==='masteryBook'){
      const before=cardMasteryLevel(card);
      const r=grantMasteryExp(card,500);
      state.consumables[id]--;
      alert(`${card.name} の熟練EXP +${Math.floor(r.added||0)}${r.afterLevel>before?`\n熟練Lv ${before} → ${r.afterLevel}`:''}`);
    }else if(id==='ultimateBook'){
      if(!ultimateItemsUnlocked()||!getUltimate(card))return;
      const before=ultimateLevel(card);
      state.ultimateUses[card.id]=(Number(state.ultimateUses[card.id])||0)+1000;
      const after=ultimateLevel(card);
      state.consumables[id]--;
      alert(`${card.name} のULTIMATE EXP +1000\n必殺Lv ${before} → ${after}`);
    }else if(id==='limitCrystal'){
      if(cardLimitRank(card)>=MAX_LIMIT_RANK)return;
      const before=cardLimitRank(card);
      const cap=typeof cardLimitMaxCopies==='function'?cardLimitMaxCopies(card):LIMIT_COPY_THRESHOLDS[MAX_LIMIT_RANK];
      state.counts[card.id]=Math.min(cap,(Number(state.counts[card.id])||0)+1);
      const after=cardLimitRank(card);
      state.consumables[id]-=need;
      alert(`${card.name} に限界突破素材+1枚分\n限界結晶 ${need}個使用${after>before?`\n★${before} → ★${after}`:''}`);
    }
    save();updateStats();renderCollection();renderTeam();renderBattle();
    openFor(card);
  }
  function openFor(card){
    if(!itemsUnlocked())return;
    ensureConsumables();buildModal();
    const modal=document.getElementById('v46ItemModal'),rows=document.getElementById('v46ItemRows');
    document.getElementById('v46ItemCardName').textContent=`${card.name} にアイテム使用`;
    const items=[
      {id:'masteryBook',name:'熟練の書',desc:'熟練EXP +500',ok:true},
      {id:'ultimateBook',name:'奥義経験書',desc:'ULTIMATE EXP +1000',ok:ultimateItemsUnlocked()&&!!getUltimate(card),reason:ultimateItemsUnlocked()?(getUltimate(card)?'':'このカードはULTIMATEを持っていません'):'15FでULTIMATE強化解禁後に使用可能'},
      {id:'limitCrystal',name:'限界結晶',desc:`限界突破素材1枚分（${DISP[card.r]}：${crystalCost(card)}個消費）`,need:crystalCost(card),ok:cardLimitRank(card)<MAX_LIMIT_RANK,reason:cardLimitRank(card)>=MAX_LIMIT_RANK?'★10 MAXです':''}
    ];
    rows.innerHTML=items.map(x=>`<div class="v46ItemRow"><div><b>${x.name}<span class="v46ItemCount">×${state.consumables[x.id]||0}</span></b><p>${x.desc}${x.ok?'':` / ${x.reason||'使用不可'}`}</p></div><button data-v46-use="${x.id}" ${(!x.ok||(state.consumables[x.id]||0)<(x.need||1))?'disabled':''}>使用</button></div>`).join('');
    rows.querySelectorAll('[data-v46-use]').forEach(b=>b.onclick=()=>consume(card,b.dataset.v46Use));
    modal.classList.add('show');
  }

  function decorateTeam(){
    if(!itemsUnlocked())return;
    buildModal();
    document.querySelectorAll('.teamSlot').forEach(slot=>{
      const detail=slot.querySelector('[data-team-slot-detail]');if(!detail)return;
      const id=detail.dataset.teamSlotDetail,quick=slot.querySelector('.slotQuickActions');
      if(!quick||quick.querySelector('[data-v46-item]'))return;
      quick.classList.add('v46Three');
      const b=document.createElement('button');b.className='slotDetailBtn v46UseItemBtn';b.dataset.v46Item=id;b.textContent='アイテム';
      b.onclick=e=>{e.stopPropagation();const c=CARDS.find(x=>x.id===id);if(c)openFor(c)};
      quick.insertBefore(b,quick.lastElementChild);
    });
    document.querySelectorAll('.teamPick').forEach(row=>{
      const src=row.querySelector('[data-team-id]')||row.querySelector('[data-team-fav]');if(!src)return;
      const id=src.dataset.teamId||src.dataset.teamFav;
      if(row.querySelector('[data-v46-list-item]'))return;
      const b=document.createElement('button');b.className='v46UseItemBtn';b.dataset.v46ListItem=id;b.textContent='アイテムを使う';
      b.onclick=e=>{e.stopPropagation();const c=CARDS.find(x=>x.id===id);if(c)openFor(c)};
      row.appendChild(b);
    });
  }

  const originalRenderTeamV46=renderTeam;
  renderTeam=function(...args){const r=originalRenderTeamV46.apply(this,args);decorateTeam();return r};
  ensureConsumables();injectCss();buildModal();renderTeam();
})();
