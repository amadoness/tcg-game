  const originalLimitProgressTextV49=limitProgressText;
  limitProgressText=function(c){
    if(!isDungeonCard(c))return originalLimitProgressTextV49(c);
    const count=Math.max(0,Number(state.counts[c.id]||0)),rank=cardLimitRank(c);
    if(count<=0)return '未所持 / ダンジョン専用DROP';
    if(rank>=MAX_LIMIT_RANK)return `★10 MAX / 所持${count}枚（完成必要30枚） / 以降のDROPは +${limitRefundCoins(c).toLocaleString()} COIN`;
    const need=DUNGEON_CARD_THRESHOLDS[rank+1];
    return `ダンジョン育成：所持${count}枚 / ★${rank+1}まであと${Math.max(0,need-count)}枚（必要${need}枚 / ★10は30枚）`;
  };

  const originalGrantOwnedCopyV49=grantOwnedCopy;
  grantOwnedCopy=function(c){
    if(!isDungeonCard(c))return originalGrantOwnedCopyV49(c);
    const before=Math.max(0,Number(state.counts[c.id]||0)),beforeLimit=cardLimitRank(c),cap=30;
    if(before>=cap){
      const refund=limitRefundCoins(c);state.coins=(state.coins||0)+refund;
      return {before,after:before,beforeLimit,afterLimit:beforeLimit,isNew:false,limitUp:0,converted:true,refund};
    }
    const after=before+1;state.counts[c.id]=after;
    const afterLimit=cardLimitRank(c);
    return {before,after,beforeLimit,afterLimit,isNew:before===0,limitUp:afterLimit>beforeLimit?afterLimit:0,converted:false,refund:0};
  };

  // Dungeon-exclusive skills strengthen at ★5 / ★8 / ★10.
  const originalGetPassiveV49=getPassive;
  getPassive=function(c){
    if(!isDungeonCard(c))return originalGetPassiveV49(c);
    const r=dungeonSkillRank(c);
    if(c.id==='dg_midas')return r>=8
      ?{name:'黄金装甲・完成',desc:'★8強化：受けるダメージを8%軽減。',damageTaken:.08}
      :{name:'黄金装甲',desc:'受けるダメージを3%軽減。★8で8%へ強化。',damageTaken:.03};
    if(c.id==='dg_varga')return r>=8
      ?{name:'武の研鑽・極',desc:'★8強化：自身の攻撃+7%・素早さ+3%。',selfAtk:.07,selfSpd:.03}
      :{name:'武の研鑽',desc:'自身の攻撃+2%。★8で攻撃+7%・素早さ+3%。',selfAtk:.02};
    if(c.id==='dg_crystalos')return r>=8
      ?{name:'晶殻・完全晶化',desc:'★8強化：最大HP+6%・防御+5%。',selfHp:.06,selfDef:.05}
      :{name:'晶殻',desc:'自身の最大HP+2%。★8で最大HP+6%・防御+5%。',selfHp:.02};
    return originalGetPassiveV49(c);
  };

  const originalGetUniqueActiveV49=getUniqueActive;
  getUniqueActive=function(c){
    if(!isDungeonCard(c))return originalGetUniqueActiveV49(c);
    const r=dungeonSkillRank(c),up=r>=5;
    if(c.id==='dg_midas')return {name:'ゴールドクラッシュ',rate:up?.16:.14,desc:up?'★5強化：通常攻撃後16%で発動。単体0.55倍＋防御-10%を2R。':'通常攻撃後14%で発動。単体0.35倍＋防御-5%を2R。★5で強化。',v49:'midas',up};
    if(c.id==='dg_varga')return {name:'連環撃',rate:up?.17:.15,desc:up?'★5強化：通常攻撃後17%で発動。単体0.22倍×3連撃。':'通常攻撃後15%で発動。単体0.18倍×2連撃。★5で強化。',v49:'varga',up};
    if(c.id==='dg_crystalos')return {name:'結晶障壁',rate:up?.17:.15,desc:up?'★5強化：通常攻撃後17%で発動。HP割合が低い味方2体へ最大HP8%シールド。':'通常攻撃後15%で発動。HP割合が最も低い味方1体へ最大HP5%シールド。★5で強化。',v49:'crystalos',up};
    return originalGetUniqueActiveV49(c);
  };

  const originalGetUltimateV49=getUltimate;
  getUltimate=function(c){
    if(!isDungeonCard(c))return originalGetUltimateV49(c);
    const r=dungeonSkillRank(c),max=r>=10;
    if(c.id==='dg_midas')return {name:'王黄金撃',condition:'hp50',conditionText:'自身HP50%以下',desc:max?'★10完成：敵全体0.70倍＋自身へ最大HP15%シールド。':'敵全体へ0.45倍。★10で0.70倍＋自身15%シールド。',v49:'midas',max};
    if(c.id==='dg_varga')return {name:'武神千裂',condition:'round3',conditionText:'3ラウンド目以降',desc:max?'★10完成：単体0.32倍×3連撃＋防御10%無視。':'単体へ0.60倍。★10で3連撃＋防御10%無視。',v49:'varga',max};
    if(c.id==='dg_crystalos')return {name:'クリスタル・サンクチュアリ',condition:'allyLow50',conditionText:'味方の誰かがHP50%以下',desc:max?'★10完成：味方全体HP10%回復＋最大HP10%シールド。':'味方全体HP5%回復。★10で回復10%＋10%シールド。',v49:'crystalos',max};
    return originalGetUltimateV49(c);
  };

  const originalPerformUniqueActiveV49=performUniqueActive;
  performUniqueActive=async function(att,allies,enemies,active){
    if(!isDungeonCard(att.card))return originalPerformUniqueActiveV49(att,allies,enemies,active);
    if(!living(enemies).length)return;
    const up=!!active.up;
    if(att.card.id==='dg_midas'){
      const t=chooseTarget(enemies),d=applyDamage(att,t,up?.55:.35),down=up?.10:.05;
      t.tempBuff={atk:t.tempBuff?.atk||0,def:Math.min(t.tempBuff?.def||0,-down),spd:t.tempBuff?.spd||0,rounds:2};
      logBattle(`${unitName(att)}「${active.name}」→ ${unitName(t)} ${d}ダメージ / 防御-${Math.round(down*100)}%`,'logSkill');
      return;
    }
    if(att.card.id==='dg_varga'){
      const t=chooseTarget(enemies),hits=up?3:2,mult=up?.22:.18;let total=0;
      for(let i=0;i<hits&&t.hp>0;i++){total+=applyDamage(att,t,mult);await battlePause(45)}
      logBattle(`${unitName(att)}「${active.name}」→ ${unitName(t)} ${hits}連撃 計${total}`,'logSkill');
      return;
    }
    if(att.card.id==='dg_crystalos'){
      const count=up?2:1,pct=up?.08:.05,targets=living(allies).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,count);
      for(const u of targets)addShield(u,u.maxHp*pct);
      logBattle(`${unitName(att)}「${active.name}」→ ${targets.map(unitName).join(' / ')}に${Math.round(pct*100)}%シールド`,'logHeal');
      return;
    }
  };

  const originalUltimatePowerMultV49=ultimatePowerMult;
  ultimatePowerMult=function(att){
