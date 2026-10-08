/* =========================================================
   CHESS ARENA — INTERFAZ REDISEÑADA
   Menú principal, perfil, inventario, pausa y mapa.
========================================================= */
"use strict";

let uiSettingsOverlay=null;
let uiGamePaused=false;

function uiStartScreenVisible(){
  const start=document.getElementById("startScreen");
  return !!start && getComputedStyle(start).display!=="none";
}

function uiSyncMode(){
  const inGame=!uiStartScreenVisible();
  const store=document.getElementById("gameStoreButton");
  const arenaStore=document.getElementById("arenaItemsButton");
  const pause=document.getElementById("pauseGameButton");
  const quick=document.getElementById("quickItemsButton");
  const map=document.getElementById("gameMapButton");

  if(store)store.style.display=inGame?"none":"none";
  if(arenaStore)arenaStore.style.display=inGame?"none":"none";
  if(pause)pause.style.display=inGame?"flex":"none";
  if(quick)quick.style.display=inGame?"flex":"none";
  if(map)map.style.display=inGame?"flex":"none";
}

function uiOpenProfile(){
  const overlay=document.getElementById("profileOverlay");
  if(!overlay)return;
  overlay.style.display="flex";

  const level=document.getElementById("profileLevelValue");
  const fill=document.getElementById("profileXPFill");
  const text=document.getElementById("profileXPText");

  const current=Math.max(0,Number(accountXp)||0);
  const required=Math.max(1,accountXpRequired(accountLevel));
  const pct=Math.min(100,current/required*100);

  if(level)level.textContent=Math.max(1,Math.floor(Number(accountLevel)||1));
  if(fill)fill.style.width=pct+"%";
  if(text)text.textContent=Math.floor(current)+" / "+required+" XP";

  const score=document.getElementById("profileScore");
  if(score)score.textContent=Math.max(0,Number(playerArmy.score)||0);

  const kills=document.getElementById("profileKills");
  if(kills)kills.textContent=Math.max(0,Number(playerArmy.score)||0);

  const chests=document.getElementById("profileChests");
  if(chests)chests.textContent=(typeof chests!=="undefined"&&Array.isArray(window.chests))?window.chests.length:0;
}

function uiCloseProfile(){
  const overlay=document.getElementById("profileOverlay");
  if(overlay)overlay.style.display="none";
}

function uiRenderInventory(){
  const content=document.getElementById("inventoryContent");
  if(!content||typeof ARENA_ITEM_DEFS==="undefined")return;

  const ids=Object.keys(ARENA_ITEM_DEFS).filter(id=>{
    return typeof arenaCount==="function"&&arenaCount(id)>0;
  });

  let html="";
  html+='<div class="inventoryLoadoutHeader"><span>EQUIPADOS</span><b>'+(Array.isArray(arenaLoadout)?arenaLoadout.length:0)+'/3</b></div>';
  html+='<div class="inventoryLoadoutRow">';

  for(let i=0;i<3;i++){
    const id=Array.isArray(arenaLoadout)?arenaLoadout[i]:null;
    if(id&&ARENA_ITEM_DEFS[id]){
      const def=ARENA_ITEM_DEFS[id];
      html+='<button type="button" class="inventoryEquippedSlot" data-inv-equip="'+id+'"><strong>'+def.icon+'</strong><span>'+def.name+'</span><small>×'+arenaCount(id)+'</small></button>';
    }else{
      html+='<div class="inventoryEquippedSlot empty"><strong>＋</strong><span>VACÍO</span><small>ESPACIO</small></div>';
    }
  }
  html+="</div>";

  if(!ids.length){
    html+='<div class="inventoryEmpty"><div>🎒</div><h3>INVENTARIO VACÍO</h3><p>Compra objetos en la tienda para poder equiparlos.</p><button type="button" id="inventoryGoShop">🏪 IR A OBJETOS</button></div>';
  }else{
    html+='<div class="inventoryGrid">';
    for(const id of ids){
      const def=ARENA_ITEM_DEFS[id];
      const count=arenaCount(id);
      const equipped=arenaIsEquipped(id);
      html+='<article class="inventoryCard '+(equipped?"equipped":"")+'">'+
        '<div class="inventoryObjectIcon">'+def.icon+'</div>'+
        '<div class="inventoryObjectInfo"><h3>'+def.name+'</h3><p>'+def.description+'</p><b>×'+count+'</b></div>'+
        '<button type="button" class="inventoryEquipButton '+(equipped?"active":"")+'" data-inv-equip="'+id+'">'+(equipped?"✓ EQUIPADO":"EQUIPAR")+'</button>'+
        '</article>';
    }
    html+="</div>";
  }

  content.innerHTML=html;

  for(const button of content.querySelectorAll("[data-inv-equip]")){
    button.addEventListener("click",()=>{
      const id=button.dataset.invEquip;
      if(typeof arenaEquipItem==="function")arenaEquipItem(id);
      uiRenderInventory();
    });
  }

  const shop=document.getElementById("inventoryGoShop");
  if(shop)shop.addEventListener("click",()=>{
    uiCloseInventory();
    if(typeof openKingdomMarket==="function")openKingdomMarket("items");
  });
}

function uiOpenInventory(){
  if(!uiStartScreenVisible()){
    showMessage("🎒 El equipamiento se prepara antes de la partida.");
    return;
  }
  const overlay=document.getElementById("inventoryOverlay");
  if(!overlay)return;
  uiRenderInventory();
  overlay.style.display="flex";
}

function uiCloseInventory(){
  const overlay=document.getElementById("inventoryOverlay");
  if(overlay)overlay.style.display="none";
}

function uiOpenQuickItems(){
  const overlay=document.getElementById("quickItemsOverlay");
  const content=document.getElementById("quickItemsContent");
  if(!overlay||!content)return;

  if(typeof ARENA_ITEM_DEFS==="undefined"||!Array.isArray(arenaLoadout)){
    content.innerHTML='<p class="quickEmpty">No hay objetos equipados.</p>';
  }else{
    content.innerHTML=arenaLoadout.length
      ?arenaLoadout.map(id=>{
        const def=ARENA_ITEM_DEFS[id];
        return '<button type="button" class="quickItemChoice" data-quick-item="'+id+'"><span>'+def.icon+'</span><b>'+def.name+'</b><small>×'+arenaCount(id)+'</small></button>';
      }).join("")
      :'<div class="quickEmpty">No tienes objetos equipados.</div>';

    for(const button of content.querySelectorAll("[data-quick-item]")){
      button.addEventListener("click",()=>{
        const id=button.dataset.quickItem;
        if(typeof arenaSelectItem==="function")arenaSelectItem(id);
        uiCloseQuickItems();
      });
    }
  }

  overlay.style.display="flex";
}

function uiCloseQuickItems(){
  const overlay=document.getElementById("quickItemsOverlay");
  if(overlay)overlay.style.display="none";
}

function uiCreateSettings(){
  if(document.getElementById("uiSettingsOverlay"))return;

  const overlay=document.createElement("div");
  overlay.id="uiSettingsOverlay";
  overlay.className="uiSettingsOverlay";
  overlay.style.display="none";
  overlay.innerHTML=
    '<div class="uiSettingsPanel">'+
      '<div class="uiSettingsHeader"><div><span>⚙️</span><h2>AJUSTES</h2></div><button id="uiSettingsClose" type="button">✕</button></div>'+
      '<div class="uiSettingsSection"><h3>CONTROLES</h3>'+
        '<div class="uiControlRow"><b>ESPACIO</b><span>Centrar cámara en el Rey</span></div>'+
        '<div class="uiControlRow"><b>CLICK DERECHO + ARRASTRAR</b><span>Mover cámara libremente</span></div>'+
        '<div class="uiControlRow"><b>1 — 5</b><span>Seleccionar piezas</span></div>'+
        '<div class="uiControlRow"><b>CLICK IZQUIERDO</b><span>Mover o atacar con la pieza seleccionada</span></div>'+
      '</div>'+
      '<button id="uiSettingsBack" class="uiSettingsBack" type="button">← VOLVER</button>'+
    '</div>';

  document.body.appendChild(overlay);
  overlay.addEventListener("click",e=>{
    if(e.target===overlay)uiCloseSettings();
  });
  document.getElementById("uiSettingsClose").addEventListener("click",uiCloseSettings);
  document.getElementById("uiSettingsBack").addEventListener("click",uiCloseSettings);
  uiSettingsOverlay=overlay;
}

function uiOpenSettings(){
  uiCreateSettings();
  uiSettingsOverlay.style.display="flex";
}

function uiCloseSettings(){
  if(uiSettingsOverlay)uiSettingsOverlay.style.display="none";
}

function uiTogglePause(){
  if(uiStartScreenVisible())return;
  uiGamePaused=!uiGamePaused;
  window.gamePaused=uiGamePaused;

  const overlay=document.getElementById("pauseOverlay");
  if(overlay)overlay.style.display=uiGamePaused?"flex":"none";

  const button=document.getElementById("pauseGameButton");
  if(button)button.textContent=uiGamePaused?"▶":"⚙️";
}

function uiResume(){
  uiGamePaused=false;
  window.gamePaused=false;
  const overlay=document.getElementById("pauseOverlay");
  if(overlay)overlay.style.display="none";
  const button=document.getElementById("pauseGameButton");
  if(button)button.textContent="⚙️";
}

function uiReturnToMenu(){
  uiGamePaused=true;
  window.gamePaused=true;
  uiCloseProfile();
  uiCloseInventory();
  uiCloseQuickItems();
  uiCloseSettings();

  const market=document.getElementById("kingdomMarket");
  if(market)market.style.display="none";

  const start=document.getElementById("startScreen");
  if(start)start.style.display="flex";

  uiSyncMode();
  updateAccountProgressUI();
}

function uiToggleMinimap(){
  const map=document.getElementById("minimap");
  if(!map)return;
  map.classList.toggle("minimapExpanded");
}

function uiBind(){
  uiCreateSettings();

  const profile=document.getElementById("profileCard");
  if(profile){
    const open=()=>uiOpenProfile();
    profile.addEventListener("click",open);
    profile.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" ")open();
    });
  }

  const google=document.getElementById("googleButton");
  if(google)google.addEventListener("click",e=>e.stopPropagation());

  const closeProfile=document.getElementById("closeProfile");
  if(closeProfile)closeProfile.addEventListener("click",uiCloseProfile);

  const pass=document.getElementById("profilePassButton");
  if(pass)pass.addEventListener("click",()=>{
    uiCloseProfile();
    if(typeof openKingdomMarket==="function")openKingdomMarket("pass");
  });

  const kingdoms=document.getElementById("startKingdomsButton");
  if(kingdoms)kingdoms.addEventListener("click",()=>{
    if(typeof openKingdomMarket==="function")openKingdomMarket("kingdoms");
  });

  const inventory=document.getElementById("startInventoryButton");
  if(inventory)inventory.addEventListener("click",uiOpenInventory);

  const closeInventory=document.getElementById("closeInventory");
  if(closeInventory)closeInventory.addEventListener("click",uiCloseInventory);

  const inventoryOverlay=document.getElementById("inventoryOverlay");
  if(inventoryOverlay)inventoryOverlay.addEventListener("click",e=>{
    if(e.target===inventoryOverlay)uiCloseInventory();
  });

  const quick=document.getElementById("quickItemsButton");
  if(quick)quick.addEventListener("click",uiOpenQuickItems);

  const closeQuick=document.getElementById("closeQuickItems");
  if(closeQuick)closeQuick.addEventListener("click",uiCloseQuickItems);

  const quickOverlay=document.getElementById("quickItemsOverlay");
  if(quickOverlay)quickOverlay.addEventListener("click",e=>{
    if(e.target===quickOverlay)uiCloseQuickItems();
  });

  const pause=document.getElementById("pauseGameButton");
  if(pause)pause.addEventListener("click",uiTogglePause);

  const resume=document.getElementById("resumeGameButton");
  if(resume)resume.addEventListener("click",uiResume);

  const restart=document.getElementById("restartGameButton");
  if(restart)restart.addEventListener("click",()=>{
    uiResume();
    if(typeof restartGame==="function")restartGame();
  });

  const menu=document.getElementById("mainMenuButton");
  if(menu)menu.addEventListener("click",uiReturnToMenu);

  const map=document.getElementById("gameMapButton");
  if(map)map.addEventListener("click",uiToggleMinimap);

  const play=document.getElementById("playButton");
  if(play)play.addEventListener("click",()=>{
    uiGamePaused=false;
    window.gamePaused=false;
    setTimeout(uiSyncMode,0);
    uiCloseSettings();
  });

  const market=document.getElementById("marketButton");
  if(market)market.addEventListener("click",()=>uiCloseSettings());

  const start=document.getElementById("startScreen");
  if(start)start.addEventListener("click",e=>{
    if(e.target===start)uiCloseProfile();
  });

  uiSyncMode();
  uiRenderInventory();
}

document.addEventListener("DOMContentLoaded",uiBind);

window.addEventListener("beforeunload",()=>{
  window.gamePaused=false;
});
