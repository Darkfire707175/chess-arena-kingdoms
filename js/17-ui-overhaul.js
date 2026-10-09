"use strict";

/* =========================================================
   CHESS ARENA — UI OVERHAUL
   Perfil · Inventario · Objetos rápidos · Pausa
========================================================= */

function ui17SetGameUtilities(show){
  const display=show?"grid":"none";
  ["pauseGameButton","quickItemsButton"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display=display;
  });
}

function ui17OpenProfile(){
  const overlay=document.getElementById("profileOverlay");
  if(!overlay)return;
  const level=Math.max(1,Number(typeof accountLevel!=="undefined"?accountLevel:1)||1);
  const xp=Math.max(0,Number(typeof accountXp!=="undefined"?accountXp:0)||0);
  const req=typeof accountXpRequired==="function"?accountXpRequired(level):150;
  const pct=Math.min(100,xp/Math.max(1,req)*100);
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set("profileLevelValue",level);
  set("profileXPText",xp+" / "+req+" XP");
  set("profileScore",Number(typeof playerArmy!=="undefined"&&playerArmy?playerArmy.score:0)||0);
  set("profileKills",typeof arenaInventory!=="undefined"?Object.values(arenaInventory).reduce((n,v)=>n+Number(v||0),0):0);
  set("profileChests",Number(typeof arenaPassLevel!=="undefined"?arenaPassLevel:1));
  const fill=document.getElementById("profileXPFill");
  if(fill)fill.style.width=pct+"%";
  overlay.style.display="flex";
}

function ui17Close(id){
  const el=document.getElementById(id);
  if(el)el.style.display="none";
}

function ui17OpenInventory(){
  const overlay=document.getElementById("inventoryOverlay");
  const content=document.getElementById("inventoryContent");
  if(!overlay||!content)return;
  const defs=typeof ARENA_ITEM_DEFS!=="undefined"?ARENA_ITEM_DEFS:{};
  const count=typeof arenaCount==="function"?arenaCount:(()=>0);
  const equipped=typeof arenaIsEquipped==="function"?arenaIsEquipped:(()=>false);
  const entries=Object.entries(defs).filter(([id])=>count(id)>0);
  if(!entries.length){
    content.innerHTML='<div class="inventoryEmpty">Tu inventario está vacío.<br>Compra objetos desde TIENDA → OBJETOS.</div>';
  }else{
    let html='<div class="inventoryGrid">';
    for(const [id,def] of entries){
      const eq=equipped(id);
      html+='<article class="inventoryCard '+(eq?"equipped":"")+'">'+
        '<div class="itemIcon">'+def.icon+'</div>'+
        '<h3>'+def.name+'</h3>'+
        '<p>'+def.description+'</p>'+
        '<div><b>×'+count(id)+'</b></div>'+
        '<button type="button" data-ui17-equip="'+id+'">'+(eq?"✓ EQUIPADO":"EQUIPAR")+'</button>'+
        '</article>';
    }
    content.innerHTML=html+'</div>';
    content.querySelectorAll("[data-ui17-equip]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        if(typeof window.arenaEquipItem==="function")arenaEquipItem(btn.dataset.ui17Equip);
        ui17OpenInventory();
      });
    });
  }
  overlay.style.display="flex";
}

function ui17OpenQuickItems(){
  const overlay=document.getElementById("quickItemsOverlay");
  const content=document.getElementById("quickItemsContent");
  if(!overlay||!content)return;
  const loadout=typeof arenaLoadout!=="undefined"?arenaLoadout:[];
  const defs=typeof ARENA_ITEM_DEFS!=="undefined"?ARENA_ITEM_DEFS:{};
  const count=typeof arenaCount==="function"?arenaCount:(()=>0);
  content.innerHTML="";
  if(!loadout.length){
    content.innerHTML='<div class="inventoryEmpty">No hay objetos equipados.</div>';
  }else{
    loadout.forEach(id=>{
      const def=defs[id];
      if(!def)return;
      const button=document.createElement("button");
      button.type="button";
      button.className="quickItemButton";
      button.innerHTML="<strong>"+def.icon+"</strong><span>"+def.name+"</span><small>×"+count(id)+"</small>";
      button.addEventListener("click",()=>{
        if(count(id)&&typeof arenaSelectItem==="function")arenaSelectItem(id);
        overlay.style.display="none";
      });
      content.appendChild(button);
    });
  }
  overlay.style.display="flex";
}

const ui17OriginalUpdate=typeof window.update==="function"?window.update:null;
const ui17OriginalAttackUpdate=typeof window.updateAttackAnimations==="function"?window.updateAttackAnimations:null;
if(ui17OriginalUpdate&&!window.__ui17UpdateWrapped){
  window.__ui17UpdateWrapped=true;
  window.update=function(dt){if(typeof gamePaused!=="undefined"&&gamePaused)return;return ui17OriginalUpdate(dt);};
  if(ui17OriginalAttackUpdate)window.updateAttackAnimations=function(dt){if(typeof gamePaused!=="undefined"&&gamePaused)return;return ui17OriginalAttackUpdate(dt);};
}

document.addEventListener("DOMContentLoaded",()=>{
  const profile=document.getElementById("profileCard");
  if(profile){
    profile.addEventListener("click",e=>{
      if(e.target.closest("#googleButton"))return;
      ui17OpenProfile();
    });
    profile.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        ui17OpenProfile();
      }
    });
  }

  document.getElementById("closeProfile")?.addEventListener("click",()=>ui17Close("profileOverlay"));
  document.getElementById("profilePassButton")?.addEventListener("click",()=>{ui17Close("profileOverlay");if(typeof openKingdomMarket==="function")openKingdomMarket("pass");});
  document.getElementById("closeInventory")?.addEventListener("click",()=>ui17Close("inventoryOverlay"));
  document.getElementById("closeQuickItems")?.addEventListener("click",()=>ui17Close("quickItemsOverlay"));

  // Keep one compact inventory shortcut on the lobby.
  const inventoryButton=document.createElement("button");
  inventoryButton.id="startInventoryButton";
  inventoryButton.type="button";
  inventoryButton.className="startCornerButton startInventoryButton";
  inventoryButton.textContent="🎒 INVENTARIO";
  inventoryButton.addEventListener("click",ui17OpenInventory);
  document.getElementById("startScreen")?.appendChild(inventoryButton);

  // Clicking the dimmed area closes the inventory instead of trapping the user.
  const inventoryOverlay=document.getElementById("inventoryOverlay");
  inventoryOverlay?.addEventListener("click",e=>{
    if(e.target===inventoryOverlay)ui17Close("inventoryOverlay");
  });

  document.getElementById("quickItemsButton")?.addEventListener("click",ui17OpenQuickItems);

  document.getElementById("pauseGameButton")?.addEventListener("click",()=>{
    gamePaused=true;
    document.getElementById("pauseOverlay").style.display="flex";
  });
  document.getElementById("resumeGameButton")?.addEventListener("click",()=>{
    gamePaused=false;
    ui17Close("pauseOverlay");
  });
  document.getElementById("restartGameButton")?.addEventListener("click",()=>{
    gamePaused=false;
    ui17Close("pauseOverlay");
    if(typeof restartGame==="function")restartGame();
  });
  document.getElementById("mainMenuButton")?.addEventListener("click",()=>{
    gamePaused=false;
    ui17Close("pauseOverlay");
    ui17SetGameUtilities(false);
    const start=document.getElementById("startScreen");
    if(start)start.style.display="flex";
  });

  const play=document.getElementById("playButton");
  if(play)play.addEventListener("click",()=>{
    // The old handler only revealed utility buttons; it never hid the full-screen lobby.
    // The game loop already runs behind this layer, so hiding it reveals the live arena.
    const start=document.getElementById("startScreen");
    if(start)start.style.display="none";
    gamePaused=false;
    ui17Close("inventoryOverlay");
    ui17Close("profileOverlay");
    ui17Close("quickItemsOverlay");
    ui17SetGameUtilities(true);
  });

  if(typeof window.restartGame==="function"&&!window.__ui17RestartWrapped){
    const originalRestart=window.restartGame;
    window.__ui17RestartWrapped=true;
    window.restartGame=function(){
      gamePaused=false;
      ui17Close("pauseOverlay");
      ui17SetGameUtilities(true);
      return originalRestart();
    };
  }

  ui17SetGameUtilities(false);
});
