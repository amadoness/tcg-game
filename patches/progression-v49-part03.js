        @media(max-width:620px){.v49DungeonGrid{grid-template-columns:1fr}.v49DungeonInfo{grid-template-columns:1fr}.v49DungeonActions.multi{grid-template-columns:1fr}.v49DungeonTop{grid-template-columns:1fr}.v49DropCard{grid-template-columns:62px 1fr}.v49DropCard img{width:62px;height:78px}}
      `;document.head.appendChild(style);
    }
    const tabs=document.querySelector('.tabs'),battleTab=tabs?.querySelector('[data-tab="battle"]');
    if(tabs&&!tabs.querySelector('[data-tab="dungeon"]')){
      const b=document.createElement('button');b.className='tabbtn';b.dataset.tab='dungeon';b.textContent='ダンジョン';
      battleTab?.insertAdjacentElement('afterend',b);b.onclick=()=>{if(dungeonUnlocked()){switchToView('dungeon');renderDungeon()}};
    }
    if(!document.getElementById('dungeon')){
      const sec=document.createElement('section');sec.id='dungeon';sec.className='view';sec.innerHTML='<div class="panel"><div id="v49DungeonRoot"></div></div>';
      document.getElementById('battle')?.insertAdjacentElement('afterend',sec);
    }
    if(!document.getElementById('v49DungeonBattleHud')){
      const hud=document.createElement('div');hud.id='v49DungeonBattleHud';
      document.querySelector('#battle .battleArena')?.insertAdjacentElement('beforebegin',hud);
    }
    if(!document.getElementById('v49BuffOverlay')){
      const o=document.createElement('div');o.id='v49BuffOverlay';o.className='v49BuffOverlay';o.innerHTML='<div class="v49BuffCard"><h3>探索中バフを選択</h3><p>この探索が終了するまで有効です。</p><div id="v49BuffChoices" class="v49BuffChoices"></div></div>';document.body.appendChild(o);
    }
    updateDungeonTab();
  }

  function updateDungeonTab(){
    const b=document.querySelector('.tabbtn[data-tab="dungeon"]');if(b)b.style.display=dungeonUnlocked()?'':'none';
  }

  function dungeonClearCount(id,diff){return Number(state.dungeonClears?.[id]?.[diff]||0)}
  function dungeonRewardText(d,df){
    const r=d.rewards[df.id],parts=[];
    if(d.id==='gold')parts.push(`COIN ${r.coin[0].toLocaleString()}〜${r.coin[1].toLocaleString()}C`);
    if(d.id==='training')parts.push(`PLAYER EXP +${r.player}`,`熟練EXP +${r.mastery}/枚`,`ULT EXP +${r.ultimate}/枚`);
    if(d.id==='crystal')parts.push(`限界結晶 ${formatPct(r.crystal)}`);
    parts.push(`専用カード ${formatPct(r.card)}`);
    return parts.join(' / ');
  }

  function renderDungeon(){
    ensureDungeonState();ensureDungeonUi();updateDungeonTab();
    const root=document.getElementById('v49DungeonRoot');if(!root)return;
    if(!dungeonUnlocked()){
      root.innerHTML=`<h2 class="sectionTitle">ダンジョン</h2><div class="newCardsNotice">無限の塔25F突破で解禁されます。</div>`;return;
    }
    if(!DUNGEONS[selectedDungeon])selectedDungeon='gold';
    if(!DIFFICULTIES[selectedDifficulty]||!difficultyUnlocked(selectedDifficulty))selectedDifficulty='normal';
    const d=DUNGEONS[selectedDungeon],df=DIFFICULTIES[selectedDifficulty],r=d.rewards[df.id],card=dungeonCardById(d.bossId),clear=dungeonClearCount(d.id,df.id);
    const last=lastDungeonResult?`<div class="v49Last"><b>前回の探索結果</b><br>${lastDungeonResult}</div>`:'';
    root.innerHTML=`
      <div class="v49DungeonTop"><div><h2 class="sectionTitle" style="margin-bottom:3px">ダンジョン</h2><div class="hint">塔25Fで解禁。キー1個で5戦の常設ダンジョンへ挑戦。難易度が上がっても消費キーは1個。</div></div><div class="v49KeyBox">🔑 ダンジョンキー × <span id="v49KeyCount">${state.dungeonKeys}</span></div></div>
      <div class="v49DungeonGrid">${Object.values(DUNGEONS).map(x=>`<button class="v49DungeonChoice ${x.id===d.id?'active':''}" data-v49-dungeon="${x.id}"><b>${x.name}</b><span>${x.tag}<br>${x.desc}</span></button>`).join('')}</div>
      <div class="v49DungeonDetail">
        <h3 style="margin:0;color:${d.accent}">${d.name}</h3><div class="hint">${d.desc}</div>
        <div class="v49Diffs">${Object.values(DIFFICULTIES).map(x=>`<button class="v49Diff ${x.id===df.id?'active':''}" data-v49-diff="${x.id}" ${difficultyUnlocked(x.id)?'':`disabled`}>${x.label}${difficultyUnlocked(x.id)?'':` 🔒${x.floor}F`}</button>`).join('')}</div>
        <div class="v49DungeonInfo">
          <div class="v49InfoBox"><b>主な報酬</b><br>${dungeonRewardText(d,df)}<br>専用カードは★10まで累計30枚。★5でACTIVE、★8でPASSIVE、★10でULTIMATEが強化。</div>
          <div class="v49InfoBox v49DropCard"><img src="${cardImage(card)}" alt="${card.name}"><div><b>[DUNGEON] ${card.name}</b><br>${limitProgressText(card)}<br>PASSIVE：${getPassive(card).name}<br>ACTIVE：${getActiveName(card)}<br>ULTIMATE：${getUltimate(card).name}</div></div>
        </div>
        <div class="v49DungeonActions ${clear>0?'multi':''}">
          <button id="v49StartDungeon" class="v49Start" ${(state.dungeonKeys<1||state.team.length!==3||battleBusy||autoBattleRunning)?'disabled':''}>挑戦する（キー1個）</button>
          ${clear>0?`<button id="v49Auto1" class="v49Auto" ${(state.dungeonKeys<1||state.team.length!==3||battleBusy||autoBattleRunning)?'disabled':''}>AUTO探索 ×1</button><button id="v49Auto3" class="v49Auto" ${(state.dungeonKeys<3||state.team.length!==3||battleBusy||autoBattleRunning)?'disabled':''}>AUTO探索 ×3</button>`:''}
        </div>
        <div class="hint" style="margin-top:6px">${df.label} クリア回数：${clear}回 / 推奨：塔${df.floor}F到達相当</div>
      </div>
