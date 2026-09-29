      return {uid:'e'+i,card:c,stats:st,hp:st.hp,maxHp:st.hp,shield:0,guard:1,side:'enemy',equipFx:{},bossSpec:bossSpec&&i===0?bossSpec:null,displayName:bossSpec&&i===0?bossSpec.name:null};
    });
    const allyAura=applyTeamPassiveAuras(allies,enemies),enemyAura=applyTeamPassiveAuras(enemies,allies),allUnits=[...allies,...enemies];
    for(const u of allies){u.team=allies;u.opponents=enemies;u.allUnits=allUnits}
    for(const u of enemies){u.team=enemies;u.opponents=allies;u.allUnits=allUnits}
    for(const team of [allies,enemies]){
      const shieldSource=team.find(u=>u.hp>0&&getPassive(u.card).startShield);
      if(shieldSource){const pct=getPassive(shieldSource.card).startShield;for(const u of team)addShield(u,u.maxHp*pct)}
    }
    for(const u of allies)if(u.equipFx?.startShield)addShield(u,u.maxHp*u.equipFx.startShield);
    if(bossSpec?.teamBarrier){const bossUnit=enemies[0];enemies.forEach(u=>u.bossBarrierSource=bossUnit)}
    $('allyUnits').innerHTML=allies.map(unitHTML).join('');$('enemyUnits').innerHTML=enemies.map(unitHTML).join('');
    if(bossSpec){$('battleResult').className='battleResult bossIntro';$('battleResult').textContent=`DUNGEON BOSS　${bossSpec.name}`;logBattle(`⚔ BOSS「${bossSpec.name}」出現！`,'logEnemy');logBattle(`特殊能力「${bossSpec.title}」：${bossSpec.desc}`,'logEnemy');await battlePause(650);$('battleResult').className='battleResult';$('battleResult').textContent=''}
    else if(elite)logBattle('⚔ ELITE BATTLE！ 通常戦より強化された敵が出現。','logEnemy');
    logBattle(`${d.name} ${df.label}　${stage}/5戦 開始。敵：${enemies.map(unitName).join(' / ')}`,'logSkill');
    if(auraSummary(allyAura)!=='なし')logBattle(`味方編成効果：${auraSummary(allyAura)}`,'logSkill');
    if(auraSummary(enemyAura)!=='なし')logBattle(`敵編成効果：${auraSummary(enemyAura)}`,'logEnemy');
    await battlePause(300);
    let round=1;
    while(teamCanContinue(allies)&&teamCanContinue(enemies)&&round<=36){
      battleRoundNo=round;logBattle(`― ROUND ${round} ―`,'mutedLine');
      await processRoundStart(allies);await processRoundStart(enemies);if(!teamCanContinue(allies)||!teamCanContinue(enemies))break;
      const order=[...living(allies),...living(enemies)].sort((a,b)=>(effectiveSpeed(b)+Math.random()*8)-(effectiveSpeed(a)+Math.random()*8));
      for(const u of order){
        if(u.hp<=0)continue;const friends=u.side==='ally'?allies:enemies,foes=u.side==='ally'?enemies:allies;if(!living(foes).length)break;
        await unitAction(u,friends,foes,{allowActive:true});
        if(u.hp>0&&u.bossSpec?.extraAttackChance&&living(foes).length&&Math.random()<u.bossSpec.extraAttackChance){const t=chooseTarget(foes),dd=applyDamage(u,t,u.bossSpec.extraAttackMult||.75,{extra:true});logBattle(`${unitName(u)}「${u.bossSpec.title}」→ ${unitName(t)}に追加${dd}ダメージ`,'logEnemy');await battlePause(130)}
        await battlePause(250);
      }
      endRoundBuffTick(allUnits);round++;
    }
    let win=living(allies).length>0&&living(enemies).length===0;
    if(round>36&&living(allies).length&&living(enemies).length){const ar=allies.reduce((s,u)=>s+Math.max(0,u.hp)/u.maxHp,0),er=enemies.reduce((s,u)=>s+Math.max(0,u.hp)/u.maxHp,0);win=ar>er}
    if(win){
      for(const u of allies)run.hpRatios[u.card.id]=Math.max(0,Math.min(1,u.hp/u.maxHp));
      const mastery=grantBattleMastery(state.team,true,stage===5?5:1);void mastery;
      $('battleResult').className='battleResult win';$('battleResult').textContent=`DUNGEON VICTORY　${stage}/5`;
      logBattle(`${stage}/5戦 勝利。残りHPを次戦へ引き継ぎます。`,'logSkill');
    }else{$('battleResult').className='battleResult lose';$('battleResult').textContent='DUNGEON DEFEAT';logBattle('探索失敗。使用したダンジョンキーは返却されます。','logEnemy')}
    battleBusy=false;save();updateStats();renderTeam();renderCollection();
    await battlePause(500);
    return win;
  }

  function campHeal(run){
    for(const id of state.team){const cur=Math.max(0,Number(run.hpRatios[id]??0));run.hpRatios[id]=Math.min(1,cur+.30)}
  }

  function treasureMult(id,amount){
    let m=1;
    if(id==='player'){if(state.treasures?.adventurerCrown)m+=.10;if(state.treasures?.heroProof)m+=.05}
    if(id==='mastery'){if(state.treasures?.heroProof)m+=.05}
    if(id==='ultimate'){if(state.treasures?.ultimateGuide)m+=.20;if(state.treasures?.ultimateOrb)m+=.10;if(state.treasures?.heroProof)m+=.05}
    return Math.round(amount*m);
  }
  function grantTrainingRewards(r){
    const player=treasureMult('player',r.player||0);state.playerExp=(Number(state.playerExp)||0)+player;
    const mastery=treasureMult('mastery',r.mastery||0),ult=treasureMult('ultimate',r.ultimate||0);
    const masteryCap=Number(MASTERY_THRESHOLDS[MASTERY_MAX_LEVEL-1]||5000);
    for(const id of state.team){
      if(mastery>0)state.masteryExp[id]=Math.min(masteryCap,(Number(state.masteryExp[id])||0)+mastery);
      const c=CARDS.find(x=>x.id===id);if(ult>0&&c&&getUltimate(c))state.ultimateUses[id]=(Number(state.ultimateUses[id])||0)+ult;
    }
    return {player,mastery,ultimate:ult};
  }

  function grantDungeonClearReward(run){
    const d=DUNGEONS[run.dungeonId],df=DIFFICULTIES[run.diffId],r=d.rewards[df.id];
    const rawCoin=randomStep5(r.coin[0],r.coin[1]);state.coins=(Number(state.coins)||0)+rawCoin;
    const train=grantTrainingRewards(r);
    let cardDrop=null,crystal=0;
    if(Math.random()<r.card){const card=dungeonCardById(d.bossId),g=grantOwnedCopy(card);cardDrop={card,g}}
    if(r.crystal>0&&Math.random()<r.crystal){ensureDungeonState();state.consumables=state.consumables||{};state.consumables.limitCrystal=(Number(state.consumables.limitCrystal)||0)+1;crystal=1}
    state.dungeonClears[d.id][df.id]=(Number(state.dungeonClears[d.id][df.id])||0)+1;
    save();updateStats();renderCollection();renderTeam();
    return {coin:rawCoin,train,cardDrop,crystal};
  }

