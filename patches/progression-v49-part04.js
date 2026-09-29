      <div class="v49Rules"><b>共通ルール</b><br>・全5戦（3戦目エリート / 5戦目ボス）。2戦目・4戦目の後に探索中バフを1つ選択。<br>・HPは戦闘間で引き継ぎ。3戦目終了後にキャンプで全員最大HP30%分回復（戦闘不能も30%で復帰）。<br>・敗北した場合は使用したキーを返却。初回クリア後はAUTO探索を使用可能。<br>・キーは塔25F以降でDROP：通常階 ${formatPct(DUNGEON_KEY_NORMAL_RATE)} / 5の倍数階 ${formatPct(DUNGEON_KEY_BOSS_RATE)}。30F以降は新しい5階区間の初突破でもキー1個。<br>・難易度解禁：NORMAL 25F / HARD 40F / HELL 60F。</div>${last}`;
    root.querySelectorAll('[data-v49-dungeon]').forEach(b=>b.onclick=()=>{selectedDungeon=b.dataset.v49Dungeon;renderDungeon()});
    root.querySelectorAll('[data-v49-diff]').forEach(b=>b.onclick=()=>{selectedDifficulty=b.dataset.v49Diff;renderDungeon()});
    document.getElementById('v49StartDungeon').onclick=()=>startDungeonSeries(d.id,df.id,1,false);
    if(document.getElementById('v49Auto1'))document.getElementById('v49Auto1').onclick=()=>startDungeonSeries(d.id,df.id,1,true);
    if(document.getElementById('v49Auto3'))document.getElementById('v49Auto3').onclick=()=>startDungeonSeries(d.id,df.id,3,true);
  }

  function applyDungeonBuffStats(st,run){
    const b=run.buffs;
    st.atk=Math.round(st.atk*Math.pow(1.10,b.atk||0));
    st.hp=Math.round(st.hp*Math.pow(1.15,b.hp||0));
    st.def=Math.round(st.def*Math.pow(1.10,b.def||0));
    st.spd=Math.round(st.spd*Math.pow(1.10,b.spd||0));
    return st;
  }
  function allyEquipWithDungeonBuff(c,run){
    const e={...equipmentEffect(c)};e.skillRate=(e.skillRate||0)+(run.buffs.active||0)*.03;return e;
  }
  function currentBuffSummary(run){
    const parts=[];for(const b of BUFFS){const n=run.buffs[b.id]||0;if(n)parts.push(`${b.name}×${n}`)}return parts.length?parts.join(' / '):'なし';
  }
  function pickThreeBuffs(){return [...BUFFS].sort(()=>Math.random()-.5).slice(0,3)}

  function chooseDungeonBuff(run,auto=false){
    const choices=pickThreeBuffs();
    if(auto){const b=choices[Math.floor(Math.random()*choices.length)];run.buffs[b.id]=(run.buffs[b.id]||0)+1;return Promise.resolve(b)}
    return new Promise(resolve=>{
      const o=document.getElementById('v49BuffOverlay'),box=document.getElementById('v49BuffChoices');
      box.innerHTML=choices.map(b=>`<button class="v49BuffChoice" data-v49-buff="${b.id}"><b>${b.name}</b><span>${b.desc}</span></button>`).join('');
      o.classList.add('show');
      box.querySelectorAll('[data-v49-buff]').forEach(btn=>btn.onclick=()=>{const b=BUFFS.find(x=>x.id===btn.dataset.v49Buff);run.buffs[b.id]=(run.buffs[b.id]||0)+1;o.classList.remove('show');resolve(b)});
    });
  }

  function ensureDungeonBattleHud(run,stage){
    const hud=document.getElementById('v49DungeonBattleHud');if(!hud)return;
    const d=DUNGEONS[run.dungeonId],df=DIFFICULTIES[run.diffId];
    hud.innerHTML=`<div class="v49BattleHudTop"><b>${d.name} ${df.label}</b><strong>${stage} / 5戦</strong></div><div class="v49BattleProgress">${stage===3?'ELITE BATTLE':stage===5?'BOSS BATTLE':'BATTLE'} / 探索バフ：${currentBuffSummary(run)}</div><div class="v49BattleSpeed">${[1,2,3].map(n=>`<button data-v49-speed="${n}" class="${Number(state.battleSpeed)===n?'active':''}">×${n}</button>`).join('')}</div>`;
    hud.querySelectorAll('[data-v49-speed]').forEach(b=>b.onclick=()=>{state.battleSpeed=Number(b.dataset.v49Speed);save();ensureDungeonBattleHud(run,stage)});
  }

  function dungeonEnemyCards(run,stage){
    const d=DUNGEONS[run.dungeonId],df=DIFFICULTIES[run.diffId],pool=d.pool.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);
    const choose=()=>pool[Math.floor(Math.random()*pool.length)];
    if(stage===5){
      const boss={...dungeonCardById(d.bossId),_dungeonRank:run.diffId==='hell'?10:run.diffId==='hard'?7:4};
      return [boss,choose(),choose()];
    }
    return [choose(),choose(),choose()];
  }

  function dungeonBossSpec(run){
    if(run.dungeonId==='gold')return {name:'黄金巨像ミダス',title:'黄金城壁',desc:'被ダメージを軽減する重装の巨像。',damageTaken:.05};
    if(run.dungeonId==='training')return {name:'古代武神ヴァルガ',title:'武神連舞',desc:'一定確率で追加攻撃を行う。',extraAttackChance:.12,extraAttackMult:.68};
    return {name:'結晶獣クリスタロス',title:'晶界障壁',desc:'生存中、敵チームの被ダメージを5%軽減。',teamBarrier:.05};
  }

  async function dungeonFight(run,stage){
    const d=DUNGEONS[run.dungeonId],df=DIFFICULTIES[run.diffId],ownCards=state.team.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);
    if(ownCards.length!==3)return false;
    dungeonRun=run;window.V49DungeonRun=run;
    document.body.classList.add('v49DungeonBattle');switchToView('battle');ensureDungeonBattleHud(run,stage);
    battleBusy=true;
    $('battleResult').className='battleResult';$('battleResult').textContent='';$('battleLog').innerHTML='';
    const stageMult=[.90,.95,1.02,1.07,1.14][stage-1];
    const scale=enemyScale(df.baseFloor+stage-1)*df.enemyMult*stageMult;
    const bossSpec=stage===5?dungeonBossSpec(run):null;
    const elite=stage===3;
    const enemiesCards=dungeonEnemyCards(run,stage);
    const allies=ownCards.map((c,i)=>{
      const st=applyDungeonBuffStats(getBattleStats(c,1),run),ratio=run.hpRatios[c.id]??1,eq=allyEquipWithDungeonBuff(c,run);
      return {uid:'a'+i,card:c,stats:st,hp:Math.round(st.hp*ratio),maxHp:st.hp,shield:0,guard:1,side:'ally',equipFx:eq};
    });
    const enemies=enemiesCards.map((c,i)=>{
      const st=getBattleStats(c,scale,false);
      if(elite&&i===0){st.hp=Math.round(st.hp*1.22);st.atk=Math.round(st.atk*1.12);st.def=Math.round(st.def*1.12)}
      if(bossSpec&&i===0){st.hp=Math.round(st.hp*1.48);st.atk=Math.round(st.atk*1.25);st.def=Math.round(st.def*1.22);st.spd=Math.round(st.spd*1.05)}
