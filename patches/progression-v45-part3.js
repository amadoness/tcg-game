;padding:8px;font-size:10px;font-weight:900}.v45StatsMode{font-size:9px;color:#9eb1cc;margin:5px 0 2px;text-align:right}
      .v45UnlockOverlay{display:none;position:fixed;inset:0;z-index:99999;background:#02050ae8;align-items:center;justify-content:center;padding:20px}.v45UnlockOverlay.show{display:flex}.v45UnlockCard{width:min(92vw,460px);border:1px solid #665228;border-radius:18px;background:radial-gradient(circle at top,#30250f,#090d14 58%);padding:24px;text-align:center;box-shadow:0 0 40px #ffcf5740}.v45UnlockCard em{font-style:normal;font-size:10px;letter-spacing:.22em;color:#ffd86a;font-weight:1000}.v45UnlockCard h2{margin:10px 0 8px;font-size:22px;color:#fff1b5}.v45UnlockCard p{font-size:11px;color:#c9d0dc;line-height:1.7}.v45UnlockCard button{margin-top:14px;width:100%;padding:11px;border:0;border-radius:11px;background:linear-gradient(#ffd96c,#c78b22);color:#1b1304;font-weight:1000}
      body.v45EquipLocked .slotEquipSelect,body.v45EquipLocked .slotEquipEffect{display:none!important}
      body.v45AutoLocked #replayModeBtn,body.v45AutoLocked .autoBattleControls,body.v45AutoLocked .autoBattleHint,body.v45AutoLocked .autoBattleSummary{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function buildV45Ui(){
    if(document.getElementById('v45Player'))return;
    v45Css();
    const wallet=document.querySelector('.walletBar');
    if(wallet){const p=document.createElement('div');p.id='v45Player';p.className='v45Player';p.innerHTML='<b id="v45PlayerLv">PLAYER Lv.1</b><div><div class="v45Bar"><i id="v45PlayerFill" style="width:0%"></i></div><small id="v45PlayerExp">EXP 0 / 500</small></div><small id="v45PlayerBonus">全カード +0.0%</small>';wallet.insertAdjacentElement('afterend',p)}

    const tabs=document.querySelector('.tabs');
    const ach=tabs?.querySelector('[data-tab="achievements"]');
    if(tabs&&!tabs.querySelector('[data-tab="items"]')){
      const b=document.createElement('button');b.className='tabbtn';b.dataset.tab='items';b.textContent='秘宝';
      tabs.insertBefore(b,ach||null);b.onclick=()=>switchToView('items');
    }
    if(!document.getElementById('items')){
      const sec=document.createElement('section');sec.id='items';sec.className='view';sec.innerHTML='<div class="panel"><h2>秘宝・アイテム</h2><div class="hint">塔の節目で永久秘宝を獲得。売却・破棄はできません。消費アイテムは10F以降の勝利時に超低確率でDROPします。</div><div id="v45Training"></div><h3>永久秘宝</h3><div id="v45Treasures" class="v45TreasureGrid"></div><h3>消費アイテム</h3><div id="v45Consumables" class="v45ItemsGrid"></div></div>';
      const eq=document.getElementById('equipment');
      (eq||document.getElementById('battle'))?.insertAdjacentElement('afterend',sec);
    }
    if(!document.getElementById('v45UnlockOverlay')){
      const o=document.createElement('div');o.id='v45UnlockOverlay';o.className='v45UnlockOverlay';o.innerHTML='<div class="v45UnlockCard"><em id="v45UnlockKicker">SYSTEM UNLOCKED</em><h2 id="v45UnlockTitle"></h2><p id="v45UnlockText"></p><button id="v45UnlockOk">OK</button></div>';document.body.appendChild(o);
    }
  }

  function renderPlayerHud(){
    buildV45Ui();const p=playerProgress();
    const box=document.getElementById('v45Player');if(!box)return;
    box.style.display=((state.tutorialStep==='complete')||(Number(state.bestFloor)||0)>=1)?'grid':'none';
    document.getElementById('v45PlayerLv').textContent=`PLAYER Lv.${p.lv}`;
    document.getElementById('v45PlayerFill').style.width=`${p.pct}%`;
    document.getElementById('v45PlayerExp').textContent=p.lv>=V45.MAX_PLAYER_LEVEL?`EXP ${Math.floor(p.exp).toLocaleString()} / MAX`:`EXP ${p.text}`;
    document.getElementById('v45PlayerBonus').textContent=`全カード +${(playerStatBonus()*100).toFixed(1)}%`;
  }

  function cardOptions(filter=()=>true){
    return CARDS.filter(c=>(state.counts[c.id]||0)>0&&filter(c)).sort((a,b)=>idx(b.r)-idx(a.r)||a.name.localeCompare(b.name,'ja')).map(c=>`<option value="${c.id}">[${DISP[c.r]}] ${c.name}</option>`).join('');
  }
  function renderItems(){
    ensureV45State();buildV45Ui();refreshTreasures();
    if(!unlocked('items'))return;
    const share=reserveMasteryShare();
    const training=document.getElementById('v45Training');
    if(training){
      const opts='<option value="">育成枠なし</option>'+cardOptions();
      training.innerHTML=`<div class="v45Training"><b>育成枠（3枚）</b><p>パーティー外の指定カードにも熟練EXPを${Math.round(share*100)}%付与。パーティーに入っているカードは二重取得しません。</p><div class="v45TrainingSlots">${[0,1,2].map(i=>`<select data-v45-training="${i}">${opts}</select>`).join('')}</div></div>`;
      training.querySelectorAll('[data-v45-training]').forEach(sel=>{const i=Number(sel.dataset.v45Training);sel.value=state.trainingSlots[i]||'';sel.onchange=()=>{const next=sel.value;if(next&&state.trainingSlots.some((x,j)=>j!==i&&x===next)){alert('同じカードは複数の育成枠に設定できません。');renderItems();return}state.trainingSlots[i]=next;save();renderItems()}});
    }
    const treasure=document.getElementById('v45Treasures');
    if(treasure)treasure.innerHTML=V45.TREASURES.map(t=>`<div class="v45Treasure ${hasTreasure(t.id)?'':'locked'}"><h4>${hasTreasure(t.id)?'◆':'🔒'} ${t.name} <span class="v45ItemCount">${t.floor}F</span></h4><p>${t.desc}</p></div>`).join('');

    const cbox=document.getElementById('v45Consumables');
    if(cbox){
      const masteryCount=state.consumables.masteryBook||0,ultCount=state.consumables.ultimateBook||0,limitCount=state.consumables.limitCrystal||0;
      cbox.innerHTML=`
        <div class="v45Item"><h4>熟練の書 <span class="v45ItemCount">×${masteryCount}