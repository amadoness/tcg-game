// v48: collection filter by pack/set. Dynamic for future sets.
(()=>{
  'use strict';

  function setNumbers(){
    return [...new Set(CARDS.map(c=>Number(c.set)||1))].sort((a,b)=>a-b);
  }

  function ensureSetFilter(){
    const sort=document.getElementById('collectionSortSelect');
    if(!sort)return null;
    let sel=document.getElementById('collectionSetFilter');
    if(!sel){
      sel=document.createElement('select');
      sel.id='collectionSetFilter';
      sort.insertAdjacentElement('beforebegin',sel);
      sort.parentElement?.classList.add('three');

      if(!document.getElementById('v48CollectionSetCss')){
        const style=document.createElement('style');
        style.id='v48CollectionSetCss';
        style.textContent='@media(max-width:560px){#collectionClearFilters{grid-column:1/-1}}';
        document.head.appendChild(style);
      }

      sel.addEventListener('change',()=>{
        state.collectionSetFilter=sel.value;
        save();
        renderCollection();
      });

      document.getElementById('collectionClearFilters')?.addEventListener('click',()=>{
        sel.value='all';
        state.collectionSetFilter='all';
        save();
        renderCollection();
      });
    }

    const nums=setNumbers();
    const desired=String(state.collectionSetFilter??sel.value??'all');
    sel.innerHTML='<option value="all">全弾</option>'+nums.map(n=>`<option value="${n}">第${n}弾</option>`).join('');
    sel.value=nums.some(n=>String(n)===desired)?desired:'all';
    state.collectionSetFilter=sel.value;
    return sel;
  }

  renderCollection=function(){
    const setSel=ensureSetFilter();
    const search=$('collectionSearchInput')?.value||'';
    const owned=$('collectionOwnedFilter')?.value||'all';
    const rarity=$('collectionRarityFilter')?.value||'all';
    const role=$('collectionRoleFilter')?.value||'all';
    const sort=$('collectionSortSelect')?.value||'rarity';
    const setFilter=setSel?.value||'all';

    let list=filterCardList(CARDS,{search,owned,rarity,role});
    if(setFilter!=='all')list=list.filter(c=>String(Number(c.set)||1)===setFilter);
    list=sortCardList(list,sort);

    const scopeLabel=setFilter==='all'?'全弾':`第${setFilter}弾`;
    if($('collectionResultCount'))$('collectionResultCount').textContent=`${scopeLabel}　表示 ${list.length} / ${CARDS.length}種類　・　所持 ${CARDS.filter(c=>(state.counts[c.id]||0)>0).length}種類`;

    $('collectionGrid').innerHTML=list.length?list.map(c=>{
      const has=(state.counts[c.id]||0)>0,fav=isFavorite(c);
      return `<div class="collectionCardWrap">
        ${cardHTML(c,true,false)}
        <button class="cardFavBtn ${fav?'on':''}" data-collection-fav="${c.id}" ${has?'':'disabled'} aria-label="お気に入り">★</button>
      </div>`;
    }).join(''):'<div class="newCardsNotice" style="grid-column:1/-1">条件に一致するカードがありません。</div>';

    bindCardViewer($('collectionGrid'));
    document.querySelectorAll('[data-collection-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.collectionFav)});
  };

  ensureSetFilter();
  renderCollection();
})();
