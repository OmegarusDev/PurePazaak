/**
 * Register the service worker and pull updates when the app is opened.
 * When a new SW activates, reload once so players land on the latest build.
 * Checks on open only — not on focus/visibility regain.
 */
function registerPwa(){
  if(!('serviceWorker' in navigator))return;
  let pendingReload=false;
  const reloadWhenSafe=()=>{
    if(typeof curScreen!=='undefined'&&curScreen==='match'&&typeof M!=='undefined'&&M){pendingReload=true;return;}
    location.reload();
  };
  globalThis.flushPwaReload=()=>{if(pendingReload){pendingReload=false;reloadWhenSafe();}};

  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      reg.addEventListener('updatefound',()=>{
        const sw=reg.installing;if(!sw)return;
        sw.addEventListener('statechange',()=>{if(sw.state==='installed'&&!navigator.serviceWorker.controller)sw.postMessage({type:'SKIP_WAITING'});});
      });
      try{await reg.update();}catch(_){/* ignore */}

      if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
    }catch(err){
      console.warn('PWA register failed:',err);
    }
  });

  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing)return;
    refreshing=true;
    reloadWhenSafe();
  });
}
