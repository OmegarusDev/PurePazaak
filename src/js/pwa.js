/**
 * Chrome WebAPK install from the title. Fullscreen is display-mode only —
 * never requestFullscreen in the browser.
 * Updates on open only — not on focus/visibility regain.
 */
let deferredInstall=null;

function isStandaloneDisplay(){
  if(typeof window==='undefined')return false;
  return window.matchMedia('(display-mode: fullscreen)').matches||
    window.matchMedia('(display-mode: standalone)').matches||
    window.matchMedia('(display-mode: minimal-ui)').matches||
    !!(window.navigator&&window.navigator.standalone);
}

function refreshInstallUi(){
  const inst=$('#bt-install');
  const quit=$('#bt-quit');
  const installed=isStandaloneDisplay();
  const canInstall=!installed&&!!deferredInstall;
  if(inst){
    inst.hidden=!canInstall;
    inst.setAttribute('aria-hidden',canInstall?'false':'true');
  }
  if(quit){
    quit.hidden=canInstall;
    quit.setAttribute('aria-hidden',canInstall?'true':'false');
  }
}

function consumeInstallPrompt(){
  if(!deferredInstall)return false;
  const ev=deferredInstall;
  deferredInstall=null;
  ev.prompt();
  Promise.resolve(ev.userChoice).catch(()=>{}).then(()=>{
    deferredInstall=null;
    refreshInstallUi();
  });
  return true;
}

function registerPwa(){
  refreshInstallUi();
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredInstall=event;
    refreshInstallUi();
  });
  window.addEventListener('appinstalled',()=>{
    deferredInstall=null;
    refreshInstallUi();
  });

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
      if(reg.waiting&&navigator.serviceWorker.controller)reg.waiting.postMessage({type:'SKIP_WAITING'});
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
