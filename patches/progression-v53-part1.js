// v53: same-rarity skill balance pass. Remove obvious strict downgrades while keeping distinct roles.
(()=>{
  'use strict';

  const passiveBuffs={
    c01:{name:'地中装甲',desc:'自身の防御+2%。受けるダメージを1%軽減。',selfDef:.02,damageTaken:.01},
    c03:{name:'見習いの闘志',desc:'自身の攻撃+2%。ACTIVEで与えるダメージ+2%。',selfAtk:.02,skillPower:.02},
    c04:{name:'白雲の追い風',desc:'自身の素早さ+2%。味方全体の素早さ+0.6%。',selfSpd:.02,teamSpd:.006},
    c05:{name:'微電流',desc:'ACTIVE発動率+1ポイント。与ダメージ+1%。',skillRate:.01,damageBonus:.01},
    c08:{name:'森の道標',desc:'味方全体の素早さ+1%。自身の防御+1%。',teamSpd:.01,selfDef:.01},
    c09:{name:'小さな星守り',desc:'味方全体の防御+1%。自身の回復量+2%。',teamDef:.01,healBonus:.02},
    n2c06:{name:'雷尾の火花',desc:'ACTIVE発動率+1ポイント。自身の素早さ+1%。',skillRate:.01,selfSpd:.01},

    u01:{name:'雷牙疾走',desc:'自身の素早さ+3%。攻撃+1.5%。',selfSpd:.03,selfAtk:.015},
    u04:{name:'星読み',desc:'ACTIVE発動率+1.5ポイント。自身の回復量+2%。',skillRate:.015,healBonus:.02},
    n2u04:{name:'星図補正',desc:'ACTIVE発動率+1.5ポイント。味方全体の素早さ+0.8%。',skillRate:.015,teamSpd:.008},
    u07:{name:'樹皮装甲',desc:'自身の最大HP・防御+2%。受けるダメージを1%軽減。',selfHp:.02,selfDef:.02,damageTaken:.01},

    r03:{name:'黒鋼装甲',desc:'自身の防御+4%。受けるダメージを1.5%軽減。',selfDef:.04,damageTaken:.015},
    r05:{name:'迅雷の鼓動',desc:'自身の素早さ+4%、ACTIVE発動率+1ポイント。与ダメージ+1.5%。',selfSpd:.04,skillRate:.01,damageBonus:.015},

    s05:{name:'天雷加速',desc:'自身の素早さ+5%、ACTIVE発動率+1.8ポイント。与ダメージ+2%。',selfSpd:.05,skillRate:.018,damageBonus:.02},

    sp03:{name:'異彩・極光翼',desc:'自身の攻撃・素早さ+4%。ACTIVEダメージ+3%。',selfAtk:.04,selfSpd:.04,skillPower:.03},

    ss04:{name:'獣王暴走',desc:'自身の攻撃+4%。HP40%以下で与ダメージ+12%。',selfAtk:.04,lowHpAtk:.12}
  };
  for(const [id,next] of Object.entries(passiveBuffs)){
    if(PASSIVES[id])Object.assign(PASSIVES[id],next);
  }

  if(UNIQUE_ACTIVES.urp02){
    Object.assign(UNIQUE_ACTIVES.urp02,{
      desc:'通常攻撃後16%で発動。敵全体へ追加0.35倍＋素早さ10%低下。その後、攻撃力最大の味方が威力85%で追加通常攻撃。さらに味方全体の素早さ+6%を2ラウンド。'
    });
  }

  if(ULTIMATES.n2urp03){
    Object.assign(ULTIMATES.n2urp03,{
      desc:'最後の敵へ3.75倍＋防御38%無視。攻撃前に対象のシールドを破壊する。'
    });
  }

  const originalPerformUniqueActiveV53=performUniqueActive;
  performUniqueActive=async function(att,allies,enemies,active){
    if(att?.card?.id!=='urp02')return originalPerformUniqueActiveV53(att,allies,enemies,active);
    const aliveFoes=()=>living(enemies);if(!aliveFoes().length)return;
    let total=0;
    for(const t of aliveFoes()){
      total+=applyDamage(att,t,.35);
      if(!t.zeroSlowApplied){t.zeroSlowApplied=true;t.stats.spd=Math.max(1,Math.round(t.stats.spd*.90))}
      await battlePause(45);
    }
    const striker=getStrongestAlly(allies);
    if(striker)await extraNormalAttack(striker,allies,enemies,.85,'無限時界追撃');
    for(const u of living(allies)){
      const cur=u.tempBuff||{};
      u.tempBuff={
        atk:cur.atk||0,
        def:cur.def||0,
        spd:Math.max(cur.spd||0,.06),
        rounds:Math.max(cur.rounds||0,2)
      };
      refreshUnit(u,'heal');
    }
    logBattle(`${unitName(att)}「${active.name}」→ 全体${total}ダメージ＋素早さ低下 / 追撃＋味方加速`,'logSkill');
  };

  const originalPerformUltimateV53=performUltimate;
  performUltimate=async function(att,allies,enemies){
    if(att?.card?.id!=='n2urp03')return originalPerformUltimateV53(att,allies,enemies);
    const ult=getUltimate(att.card);if(!ult||att.ultimateUsed||att.hp<=0||!living(enemies).length)return false;
    const lv=att.side==='ally'?ultimateLevel(att.card):1,pm=ultimatePowerMult(att);
    att.ultimateUsed=true;
    await showUltimateFX(att,ult,lv);
    logBattle(`ULTIMATE！ ${unitName(att)}「${ult.name}」 Lv.${lv}`,'logSkill');
    const t=chooseTarget(enemies),broken=Math.round(t.shield||0);
    t.shield=0;
    const total=applyDamage(att,t,3.75*pm,{ignoreDef:.38});
    refreshUnit(t,'hit');
    logBattle(`${unitName(t)}に神獣終撃 ${total}ダメージ${broken?` / シールド${broken}破壊`:''}`,'logSkill');
    if(att.side==='ally'){
      const g=grantUltimateUse(att.card);
      if(g.afterLevel>g.beforeLevel)logBattle(`${att.card.name} 必殺技Lv ${g.beforeLevel} → ${g.afterLevel}！`,'logSkill');
    }
    return true;
  };

  try{renderTeam();renderCollection()}catch(e){console.warn('v53 skill balance refresh failed',e)}
})();
