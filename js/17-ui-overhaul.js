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
  set("profileScore",Number(window.playerArmy?.score||0));
  set("profileKills",Object.values(window.arenaInventory||{}).reduce((n,v)=>n+Number(v||0),0));
  set("profileChests",Number(window.arenaPassLevel||1));
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
  const defs=window.ARENA_ITEM_DEFS||{};
  const count=window.arenaCount||(()=>0);
  const equipped=window.arenaIsEquipped||(()=>false);
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
        if(typeof window.arenaEquipItem==="function")window.arenaEquipItem(btn.dataset.ui17Equip);
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
  const loadout=window.arenaLoadout||[];
  const defs=window.ARENA_ITEM_DEFS||{};
  const count=window.arenaCount||(()=>0);
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
        if(count(id)&&typeof window.arenaSelectItem==="function")window.arenaSelectItem(id);
        overlay.style.display="none";
      });
      content.appendChild(button);
    });
  }
  overlay.style.display="flex";
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
  document.getElementById("closeInventory")?.addEventListener("click",()=>ui17Close("inventoryOverlay"));
  document.getElementById("closeQuickItems")?.addEventListener("click",()=>ui17Close("quickItemsOverlay"));

  const inventoryButton=document.createElement("button");
  inventoryButton.id="startInventoryButton";
  inventoryButton.type="button";
  inventoryButton.className="startCornerButton startInventoryButton";
  inventoryButton.textContent="🎒 INVENTARIO";
  inventoryButton.addEventListener("click",ui17OpenInventory);
  document.getElementById("startScreen")?.appendChild(inventoryButton);

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
  if(play)play.addEventListener("click",()=>ui17SetGameUtilities(true));

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
