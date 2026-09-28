</span></h4><p>${V45.ITEMS.masteryBook.desc}</p><select id="v45MasteryTarget"><option value="">使用するカードを選択</option>${cardOptions()}</select><button id="v45UseMastery" ${masteryCount<1?'disabled':''}>使用する</button></div>
        <div class="v45Item"><h4>奥義経験書 <span class="v45ItemCount">×${ultCount}</span></h4><p>${V45.ITEMS.ultimateBook.desc}${unlocked('ultimate')?'':'（15FでULTIMATE強化解禁後に使用可能）'}</p><select id="v45UltimateTarget"><option value="">使用するカードを選択</option>${cardOptions(c=>!!getUltimate(c))}</select><button id="v45UseUltimate" ${(ultCount<1||!unlocked('ultimate'))?'disabled':''}>使用する</button></div>
        <div class="v45Item"><h4>限界結晶 <span class="v45ItemCount">×${limitCount}</span></h4><p>${V45.ITEMS.limitCrystal.desc}${unlocked('limit')?'':'（3Fで限界突破解禁後に使用可能）'}</p><select id="v45LimitTarget"><option value="">使用するカードを選択</option>${cardOptions(c=>cardLimitRank(c)<MAX_LIMIT_RANK)}</select><button id="v45UseLimit" ${(limitCount<1||!unlocked('limit'))?'disabled':''}>使用する</button></div>`;
      const use=(id,targetId,fn)=>{const sel=document.getElementById(targetId),card=CARDS.find(c=>c.id===sel?.value);if(!card){alert('カードを選択してください。');return}if((state.consumables[id]||0)<1)return;fn(card);state.consumables[id]--;save();renderItems();renderTeam();renderCollection();renderPlayerHud()};
      document.getElementById('v45UseMastery').onclick=()=>use('masteryBook','v45MasteryTarget',c=>{const r=addMasteryExp(c,500);alert(`${c.name} の熟練EXP +${Math.floor(r.added)}${r.afterLevel>r.beforeLevel?`\n熟練Lv ${r.beforeLevel} → ${r.afterLevel}`:''}`)});
      document.getElementById('v45UseUltimate').onclick=()=>use('ultimateBook','v45UltimateTarget',c=>{const r=addUltimateExp(c,1000);alert(`${c.name} のULTIMATE EXP +1000\n必殺Lv ${r.beforeLevel} → ${r.afterLevel}`)});
      document.getElementById('v45UseLimit').onclick=()=>use('limitCrystal','v45LimitTarget',c=>{const before=cardLimitRank(c);state.counts[c.id]=Math.min(LIMIT_COPY_THRESHOLDS[MAX_LIMIT_RANK],(state.counts[c.id]||0)+1);const after=cardLimitRank(c);alert(`${c.name} に限界突破素材+1枚分${after>before?`\n★${before} → ★${after}`:''}`)});
    }
  }

  function updateFeatureLocks(){
    buildV45Ui();ensureV45State();
    const equipBtn=document.querySelector('.tabbtn[data-tab="equipment"]');if(equipBtn)equipBtn.style.display=unlocked('equipment')?'':'none';
    const itemBtn=document.querySelector('.tabbtn[data-tab="items"]');if(itemBtn)itemBtn.style.display=unlocked('items')?'':'none';
    document.body.classList.toggle('v45EquipLocked',!unlocked('equipment'));
    document.body.classList.toggle('v45AutoLocked',!unlocked('auto'));
    if(!unlocked('auto')&&state.battleMode==='replay'){state.battleMode='progress';state.replayFloor=1}
  }

  function initialStats(c){
    const role=c.r==='GOD'?'god':(THEME_ROLE[c.theme]||'balanced');
    const base=ROLE_BASE[role],rm=RARITY_MULT[c.r]||1,seed=stableN(c.id),setBoost=c.set===2?1.01+(seed%21)/1000:1;
    const va=.985+(seed%31)/1000,vd=.985+((seed>>5)%31)/1000,vs=.99+((seed>>10)%21)/1000;
    return {hp:Math.round(base.hp*GLOBAL_HP_MULT*rm*setBoost),atk:Math.round(base.atk*rm*setBoost*va),def:Math.round(base.def*rm*setBoost*vd),spd:Math.round(base.spd*rm*setBoost*vs)};
  }
  function enhanceViewer(c){
    const box=document.getElementById('viewerCard');if(!box)return;
    const limit=box.querySelector('.viewerLimitBox'),mastery=box.querySelector('.viewerMasteryBox'),equip=box.querySelector('.viewerEquipBox'),ult=box.querySelector('.viewerUltimateBox');
    if(limit)limit.style.display=unlocked('limit')?'':'none';
    if(mastery)mastery.style.display=unlocked('mastery')?'':'none';
    if(equip)equip.style.display=unlocked('equipment')?'':'none';
    if(ult){ult.style.display=unlocked('ultimate')?'':'none';ult.innerHTML=ult.innerHTML.replace(/使用回数/g,'EXP').replace(/実際に必殺技が発動した戦闘のみ使用回数\+1/g,'必殺技発動でEXP獲得')}
    const stats=box.querySelector('.viewerBattleStats');if(!stats)return;
    const mode=document.createElement('div');mode.className='v45StatsMode';mode.textContent=`現在値：PLAYER Lv.${playerProgress().lv}補正込み`;
    const btn=document.createElement('button');btn.className='v45StatsToggle';btn.textContent='初期ステータスを見る';let baseMode=false;
    const current=getBattleStats(c),base=initialStats(c);
    const draw=()=>{const s=baseMode?base:current;stats.innerHTML=`<div>HP<b>${s.hp}</b></div><div>攻撃<b>${s.atk}</b></div><div>防御<b>${s.def}</b></div><div>素早さ<b>${s.spd}</b></div>`;mode.textContent=baseMode?'初期値：限界突破・熟練度・PLAYER Lv・装備・自己PASSIVE補正なし':`現在値：PLAYER Lv.${playerProgress().lv}補正込み`;btn.textContent=baseMode?'現在ステータスに戻す':'初期ステータスを見る'};
    stats.insertAdjacentElement('beforebegin',mode);stats.insertAdjacentElement('beforebegin',btn);btn.onclick=()=>{baseMode=!baseMode;draw()};draw();
  }
  const originalOpenCardViewer=openCardViewer;
  openCardViewer=function(c){originalOpenCardViewer(c);enhanceViewer(c)};

  function unlockNotice(title,text,kicker='SYSTEM UNLOCKED'){
    buildV45Ui();return new Promise(resolve=>{const o=document.getElementById('v45UnlockOverlay');document.getElementById('v45UnlockKicker').textContent=kicker;document.getElementById('v45UnlockTitle').textContent=title;document.getElementById('v45UnlockText').textContent=text;o.classList.add('show');document.getElementById('v45UnlockOk').onclick=()=>{o.classList.remove('show');resolve()}})
  }
  function unlockEventsBetween(before,after){
    const e=[];
    const add=(f,title,text,k='SYSTEM UNLOCKED')=>{if(before<f&&after>=f)e.push(