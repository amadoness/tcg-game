    let m=originalUltimatePowerMultV49(att);
    if(att?.side==='ally'&&dungeonRun?.buffs?.ult)m*=1+dungeonRun.buffs.ult*.15;
    return m;
  };

  const originalPerformUltimateV49=performUltimate;
  performUltimate=async function(att,allies,enemies){
    if(!isDungeonCard(att.card))return originalPerformUltimateV49(att,allies,enemies);
    const ult=getUltimate(att.card);if(!ult||!living(enemies).length)return false;
    const lv=att.side==='ally'?ultimateLevel(att.card):1,pm=ultimatePowerMult(att),max=!!ult.max;
    att.ultimateUsed=true;
    await showUltimateFX(att,ult,lv);
    logBattle(`ULTIMATE！ ${unitName(att)}「${ult.name}」 Lv.${lv}`,'logSkill');
    if(att.card.id==='dg_midas'){
      let total=0;for(const t of living(enemies))total+=applyDamage(att,t,(max?.70:.45)*pm);
      if(max)addShield(att,att.maxHp*.15*pm);
      logBattle(`敵全体に計${total}ダメージ${max?' / 自身シールド':''}`,'logSkill');
    }else if(att.card.id==='dg_varga'){
      const t=chooseTarget(enemies);let total=0;
      if(max){for(let i=0;i<3&&t.hp>0;i++)total+=applyDamage(att,t,.32*pm,{ignoreDef:.10})}
      else total=applyDamage(att,t,.60*pm);
      logBattle(`${unitName(t)}に${max?'3連撃 ':''}計${total}ダメージ`,'logSkill');
    }else if(att.card.id==='dg_crystalos'){
      const pct=(max?.10:.05)*pm;
      for(const u of living(allies)){const h=Math.round(u.maxHp*pct);u.hp=Math.min(u.maxHp,u.hp+h);if(max)addShield(u,u.maxHp*.10*pm);refreshUnit(u,'heal')}
      logBattle(`味方全体HP${Math.round(pct*100)}%回復${max?'＋シールド':''}`,'logHeal');
    }
    if(att.side==='ally'){
      const g=grantUltimateUse(att.card);
      if(g.afterLevel>g.beforeLevel)logBattle(`${att.card.name} 必殺技Lv ${g.beforeLevel} → ${g.afterLevel}！`,'logSkill');
    }
    return true;
  };

  function ensureDungeonUi(){
    if(!document.getElementById('v49DungeonCss')){
      const style=document.createElement('style');style.id='v49DungeonCss';style.textContent=`
        .v49DungeonTop{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-bottom:12px}.v49KeyBox{border:1px solid #715f32;background:#211a0c;border-radius:12px;padding:9px 13px;color:#ffe29a;font-weight:1000;white-space:nowrap}.v49DungeonGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v49DungeonChoice{border:1px solid #34425a;background:#0d1420;color:#eaf1ff;border-radius:13px;padding:12px;text-align:left;min-height:112px}.v49DungeonChoice.active{border-color:#c79836;box-shadow:0 0 0 1px #c79836 inset;background:#18150e}.v49DungeonChoice b{display:block;font-size:13px;margin-bottom:4px}.v49DungeonChoice span{font-size:9px;color:#9eabc0;line-height:1.5}.v49DungeonDetail{margin-top:10px;border:1px solid #303a4d;background:#090e16;border-radius:14px;padding:12px}.v49Diffs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:9px 0}.v49Diff{border:1px solid #46526a;background:#111824;color:#dbe5f7;border-radius:10px;padding:9px;font-weight:1000}.v49Diff.active{border-color:#d3a23f;background:#2a210d;color:#ffe7a6}.v49Diff:disabled{opacity:.30}.v49DungeonInfo{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v49InfoBox{border:1px solid #263247;background:#0d1420;border-radius:11px;padding:10px;font-size:9px;line-height:1.65;color:#b7c2d3}.v49InfoBox b{color:#eef4ff}.v49DropCard{display:grid;grid-template-columns:72px 1fr;gap:9px;align-items:center}.v49DropCard img{width:72px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #44536c}.v49DungeonActions{display:grid;grid-template-columns:1fr;gap:7px;margin-top:10px}.v49DungeonActions.multi{grid-template-columns:1.3fr 1fr 1fr}.v49Start{border:1px solid #c39434;background:linear-gradient(#60430e,#382606);color:#fff0bd;border-radius:12px;padding:12px;font-weight:1000}.v49Auto{border:1px solid #41678b;background:#10263a;color:#d9efff;border-radius:12px;padding:10px;font-weight:900}.v49Start:disabled,.v49Auto:disabled{opacity:.35}.v49Rules{margin-top:10px;border:1px solid #2a3445;border-radius:12px;padding:10px;font-size:9px;color:#9facbf;line-height:1.7}.v49Last{margin-top:10px;border:1px solid #486243;background:#0e1a10;border-radius:11px;padding:10px;font-size:9px;line-height:1.6;color:#cce8c8}.v49Last b{color:#bff29f}
        #v49DungeonBattleHud{display:none;border:1px solid #66522d;background:#151108;border-radius:12px;padding:10px;margin-bottom:10px}.v49DungeonBattle #v49DungeonBattleHud{display:block}.v49DungeonBattle .tabs{pointer-events:none;opacity:.65}.v49DungeonBattle .battleHeader,.v49DungeonBattle .battleInfoGrid,.v49DungeonBattle .towerModeSwitch,.v49DungeonBattle .towerEconomy,.v49DungeonBattle .autoBattlePanel,.v49DungeonBattle .enemyPreview,.v49DungeonBattle #battleStartBtn{display:none!important}.v49BattleHudTop{display:flex;justify-content:space-between;gap:8px;align-items:center}.v49BattleHudTop b{color:#ffe4a1}.v49BattleProgress{font-size:10px;color:#bac5d6;margin-top:5px}.v49BattleSpeed{display:flex;gap:5px;margin-top:8px}.v49BattleSpeed button{border:1px solid #3c4a62;background:#101722;color:#dbe4f4;border-radius:8px;padding:5px 10px}.v49BattleSpeed button.active{border-color:#cda03c;color:#ffe49a;background:#2a210e}
        .v49BuffOverlay{display:none;position:fixed;inset:0;z-index:100010;background:#02050ade;align-items:center;justify-content:center;padding:16px}.v49BuffOverlay.show{display:flex}.v49BuffCard{width:min(94vw,520px);border:1px solid #5d4f2d;background:#0b1018;border-radius:16px;padding:15px}.v49BuffCard h3{margin:0 0 5px;color:#ffe4a1}.v49BuffCard p{font-size:9px;color:#9facbf}.v49BuffChoices{display:grid;gap:8px;margin-top:10px}.v49BuffChoice{border:1px solid #40506b;background:#111a28;color:#eaf1ff;border-radius:11px;padding:11px;text-align:left}.v49BuffChoice b{display:block;color:#ffd974;margin-bottom:3px}.v49BuffChoice span{font-size:9px;color:#aab7ca}
