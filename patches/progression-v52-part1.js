// v52: keep bulk GOD PACK occurrences mysterious until each one actually appears.
(()=>{
  'use strict';

  const RE=/GOD\s*PACK\s*\d+\s*\/\s*\d+/gi;
  function scrubNode(root){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){
      const next=(root.nodeValue||'').replace(RE,'GOD PACK');
      if(next!==root.nodeValue)root.nodeValue=next;
      return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      const next=(n.nodeValue||'').replace(RE,'GOD PACK');
      if(next!==n.nodeValue)n.nodeValue=next;
    }
  }

  const target=document.getElementById('gacha')||document.body;
  scrubNode(target);
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='characterData')scrubNode(m.target);
      for(const n of m.addedNodes)scrubNode(n);
    }
  });
  observer.observe(target,{subtree:true,childList:true,characterData:true});
})();
