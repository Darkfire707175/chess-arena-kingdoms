/* =========================================================
   CHESS ARENA — MODO CONQUISTA TERRITORIAL
   Sistema aislado: no cambia el modo Endless ni sus texturas.
========================================================= */
"use strict";

let conquestActive=false;
let conquestState=null;
let conquestModeOverlay=null;
let conquestLastMessage="";
let conquestStartingNew=false;

function conquestCreateModePicker(){
  if(document.getElementById("conquestModePicker"))return;
  const overlay=document.createElement("div");
  overlay.id="conquestModePicker";
  overlay.innerHTML=
    '<section class="conquestPickerPanel">'+
      '<div class="conquestPickerCrown">♛</div>'+
      '<p class="conquestEyebrow">CHESS ARENA — KINGDOMS</p>'+
      '<h2>ELIGE TU MODO</h2>'+
      '<p class="conquestPickerIntro">Dos formas de forjar tu reino.</p>'+
      '<button type="button" class="conquestModeCard" data-mode="endless">'+
        '<span class="conquestModeIcon">♾️</span><span><b>ENDLESS</b><small>Combate libre, crecimiento y supervivencia.</small></span><span class="conquestModeArrow">›</span>'+
      '</button>'+
      '<button type="button" class="conquestModeCard conquestModeCardFeatured" data-mode="conquest">'+
        '<span class="conquestModeIcon">🏰</span><span><b>CONQUISTA TERRITORIAL</b><small>Rompe la muralla, captura los puestos y destruye la base.</small></span><span class="conquestModeArrow">›</span>'+
      '</button>'+
      '<button type="button" class="conquestPickerBack">VOLVER</button>'+
    '</section>';
  const style=document.createElement("style");
  style.textContent=
    '#conquestModePicker{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(5,9,17,.82);backdrop-filter:blur(10px);font-family:system-ui,Arial,sans-serif;color:#f8f2df}'+
    '.conquestPickerPanel{width:min(570px,100%);padding:clamp(22px,4vw,38px);border:1px solid rgba(235,196,107,.48);border-radius:22px;background:linear-gradient(145deg,#192b35,#101821 75%);box-shadow:0 24px 80px #0009;text-align:center}'+
    '.conquestPickerCrown{font-size:42px;color:#f0c96b;text-shadow:0 4px #5e3d1c}'+
    '.conquestEyebrow{margin:5px 0;color:#e8c878;font-size:10px;letter-spacing:3px;font-weight:800}'+
    '.conquestPickerPanel h2{margin:8px 0;font-size:clamp(24px,5vw,34px);letter-spacing:1px}'+
    '.conquestPickerIntro{margin:0 0 24px;color:#b7c3cc;font-size:14px}'+
    '.conquestModeCard{width:100%;display:flex;align-items:center;gap:15px;text-align:left;padding:17px;margin:11px 0;border:1px solid #455565;border-radius:13px;background:#18232d;color:#fff;cursor:pointer;transition:transform .15s,border-color .15s,background .15s}'+
    '.conquestModeCard:hover{transform:translateY(-2px);border-color:#f0ca70;background:#22333d}'+
    '.conquestModeCardFeatured{border-color:#c79e4f;background:linear-gradient(110deg,#29392f,#1a2932)}'+
    '.conquestModeIcon{font-size:30px;min-width:38px;text-align:center}'+
    '.conquestModeCard b{display:block;font-size:14px;letter-spacing:.8px}'+
    '.conquestModeCard small{display:block;margin-top:5px;color:#c0cbd1;font-size:12px;line-height:1.45}'+
    '.conquestModeArrow{margin-left:auto;font-size:30px;color:#e8c878}'+
    '.conquestPickerBack{margin-top:10px;border:0;background:transparent;color:#c4cbd2;padding:12px 20px;cursor:pointer;font-weight:800;letter-spacing:1px}'+
    '#conquestHud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:30;display:none;max-width:min(900px,calc(100vw - 24px));padding:10px 15px;border:1px solid #d8b967;border-radius:12px;background:rgba(12,22,25,.91);color:#fff1c9;text-align:center;box-shadow:0 8px 25px #0006;font:700 12px/1.5 system-ui,Arial,sans-serif;pointer-events:none}'+
    '#conquestHud b{color:#f4d67b}'+
    '@media(max-width:520px){.conquestPickerPanel{padding:20px 14px}.conquestModeCard{gap:9px;padding:13px}.conquestModeCard small{font-size:11px}}';
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  overlay.querySelector(".conquestPickerBack").addEventListener("click",()=>overlay.style.display="none");
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.style.display="none";});
  overlay.querySelectorAll("[data-mode]").forEach(button=>{
    button.addEventListener("click",()=>{
      const mode=button.dataset.mode;
      overlay.style.display="none";
      if(mode==="endless"){
        conquestActive=false;
        conquestState=null;
        const diplomacyButton=document.getElementById("conquestDiplomacyButton");
        if(diplomacyButton)diplomacyButton.style.display="none";
        if(conquestDiplomacyPanel)conquestDiplomacyPanel.style.display="none";
        conquestRealms=[];
        if(typeof restartGame==="function")restartGame();
        const start=document.getElementById("startScreen");
        if(start)start.style.display="none";
        if(typeof gamePaused!=="undefined")gamePaused=false;
        window.gamePaused=false;
        showMessage("♾️ Modo Endless: ¡que empiece el combate!");
        if(typeof saveProgress==="function")saveProgress();
      }else{
        conquestStartFresh();
      }
    });
  });
  const hud=document.createElement("div");
  hud.id="conquestHud";
  document.body.appendChild(hud);
  conquestModeOverlay=overlay;
}

function conquestStartFresh(){
  conquestActive=true;conquestState=null;conquestRealms=[];conquestAllies=new Set();if(conquestDiplomacyPanel)conquestDiplomacyPanel.style.display="none";
  if(typeof restartGame==="function"){conquestStartingNew=true;restartGame();conquestStartingNew=false;}else{const start=document.getElementById("startScreen");if(start)start.style.display="none";}
  /* Conquista no reutiliza los ocho ejércitos genéricos de Endless. */
  units=units.filter(u=>u.army===playerArmy);
  armies=[];
  conquestBuildFortress();if(typeof gamePaused!=="undefined")gamePaused=false;window.gamePaused=false;
  const pause=document.getElementById("pauseOverlay");if(pause)pause.style.display="none";const button=document.getElementById("pauseGameButton");if(button)button.textContent="⚙️";
  showMessage("👑 Tu reino está listo. Conquista los castillos enemigos para expandir tu territorio.");conquestUpdateHud();if(typeof saveProgress==="function")saveProgress();
}

function conquestBuildFortress(){
  const king=units.find(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&u.type==="king");if(!king)return;
  const cx=clamp(king.x,8,MAP_W-9),cy=clamp(king.y+3,8,MAP_H-9);
  conquestState={isHome:true,cx,cy,outerHP:0,baseHP:100,innerOpen:true,outerBreachOpen:true,
    posts:[{id:"home-north",x:cx,y:cy-4,label:"Puesto Norte",owner:"player",progress:0,progressArmy:null},{id:"home-south",x:cx,y:cy+4,label:"Puesto Sur",owner:"player",progress:0,progressArmy:null},{id:"home-west",x:cx-4,y:cy,label:"Puesto Oeste",owner:"player",progress:0,progressArmy:null},{id:"home-east",x:cx+4,y:cy,label:"Puesto Este",owner:"player",progress:0,progressArmy:null}],
    defenders:playerArmy,won:false};
  /* No se borra ni se sustituye el ejército inicial: esta es la capital propia. */
  conquestBuildOtherRealms();
  /* Alejar la cámara al entrar para mostrar castillos y fronteras a la vez. */
  camera.zoom=Math.min(Number(camera.zoom)||1,.72);
  camera.x=king.x*TILE+TILE/2;camera.y=king.y*TILE+TILE/2;
  if(typeof clampCamera==="function")clampCamera();
}

function conquestFindSpawn(x,y){
  const candidates=[[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1],[x+1,y+1],[x-1,y+1],[x+1,y-1],[x-1,y-1],[x+2,y],[x-2,y]];
  for(const [sx,sy] of candidates){
    if(!inBounds(sx,sy))continue;
    if(units.some(u=>u.alive&&!u.deadAnimating&&u.x===sx&&u.y===sy))continue;
    if(terrain[sy]?.[sx]==="water"||terrain[sy]?.[sx]==="stone"||terrain[sy]?.[sx]==="volcanicRock")continue;
    return{x:sx,y:sy};
  }
  return null;
}

function conquestWallCells(){
  if(!conquestActive||!conquestState||conquestState.isHome)return[];
  const s=conquestState,{cx,cy}=s,cells=[];
  for(let x=cx-8;x<=cx+8;x++){if(x!==cx)cells.push({x,y:cy-8,kind:"outer"},{x,y:cy+8,kind:"outer"});}
  for(let y=cy-7;y<=cy+7;y++){if(y!==cy)cells.push({x:cx-8,y,kind:"outer"},{x:cx+8,y,kind:"outer"});}
  if(!s.innerOpen){for(let x=cx-3;x<=cx+3;x++)cells.push({x,y:cy-3,kind:"inner"},{x,y:cy+3,kind:"inner"});for(let y=cy-2;y<=cy+2;y++)cells.push({x:cx-3,y,kind:"inner"},{x:cx+3,y,kind:"inner"});}
  return cells.filter(c=>inBounds(c.x,c.y));
}

function conquestRealmGate(realm,x,y){
  return (x===realm.x&&Math.abs(y-realm.y)===5)||(y===realm.y&&Math.abs(x-realm.x)===5);
}
function conquestIsWall(x,y){
  const main=conquestWallCells().find(c=>c.x===x&&c.y===y);
  if(main)return main;
  for(const realm of conquestRealms){
    const onRing=(Math.abs(x-realm.x)===5&&Math.abs(y-realm.y)<=5)||(Math.abs(y-realm.y)===5&&Math.abs(x-realm.x)<=5);
    if(onRing&&!conquestRealmGate(realm,x,y))return {x,y,kind:"realm",realm};
  }
  return null;
}

function conquestCanEnter(x,y){
  return !conquestIsWall(x,y);
}

function conquestHasFriendlyNear(x,y){
  return units.some(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&Math.max(Math.abs(u.x-x),Math.abs(u.y-y))<=1);
}

function conquestHandleClick(sx,sy){
  if(!conquestActive||!conquestState)return false;
  const world=screenToWorld(sx,sy),cell=tileAtWorld(world.x,world.y);if(!inBounds(cell.x,cell.y))return false;
  if(conquestState.isHome&&Math.abs(cell.x-conquestState.cx)<=2&&Math.abs(cell.y-conquestState.cy)<=2){showMessage("👑 Esta es tu capital: ya te pertenece. ¡Conquista uno de los reinos enemigos del mapa!");return true;}
  const wall=conquestIsWall(cell.x,cell.y);
  if(wall){if(wall.kind==="realm")showMessage("🏰 La muralla de "+wall.realm.name+" tiene puertas abiertas. Entra por una puerta para disputar sus puestos.");return true;}
  for(const realm of conquestRealms){
    if(Math.abs(cell.x-realm.x)<=1&&Math.abs(cell.y-realm.y)<=1){
      if(!realm.posts.every(p=>p.owner===playerArmy)){showMessage("🔒 "+realm.name+": captura sus cuatro puestos antes de atacar la base.");return true;}
      if(!conquestHasFriendlyNear(cell.x,cell.y)){showMessage("⚔️ Acerca una pieza aliada a la base de "+realm.name+".");return true;}
      realm.baseHP=Math.max(0,realm.baseHP-10);showMessage("🏰 "+realm.name+": base al "+realm.baseHP+"%.");
      if(realm.baseHP===0){for(const u of units){if(u.army===realm.army){u.alive=false;u.deadAnimating=true;}}armies=armies.filter(a=>a!==realm.army);conquestRealms=conquestRealms.filter(r=>r!==realm);showMessage("🏆 ¡Has conquistado "+realm.name+"! Su territorio pasa a formar parte de tu reino.");}
      conquestUpdateHud();if(typeof saveProgress==="function")saveProgress();return true;
    }
  }
  return false;
}

function conquestTick(dt){
  if(!conquestActive||!conquestState||conquestState.won)return;
  for(const realm of conquestRealms){
    for(const post of realm.posts){
      const contenders=units.filter(u=>u.alive&&!u.deadAnimating&&Math.max(Math.abs(u.x-post.x),Math.abs(u.y-post.y))<=1),sides=[...new Set(contenders.map(u=>u.army).filter(Boolean))];
      if(sides.length!==1){post.progress=0;post.progressArmy=null;continue;}
      const side=sides[0];if(post.progressArmy!==side){post.progress=0;post.progressArmy=side;}post.progress+=dt;
      if(post.progress>=3){const changed=post.owner!==side;post.owner=side;post.progress=0;post.progressArmy=null;if(changed)showMessage(side===playerArmy?"🏴 ¡Puesto de "+realm.name+" conquistado!":"🛡️ Un puesto de "+realm.name+" ha cambiado de manos.");}
    }
    realm.baseCaptured=realm.posts.every(p=>p.owner===playerArmy);
  }
  conquestUpdateHud();
}

function conquestUpdateHud(){
  const hud=document.getElementById("conquestHud"),diplomacy=document.getElementById("conquestDiplomacyButton");if(diplomacy)diplomacy.style.display=conquestActive?"block":"none";
  if(!hud)return;if(!conquestActive||!conquestState){hud.style.display="none";return;}
  hud.style.display="block";hud.innerHTML='👑 <b>CONQUISTA TERRITORIAL</b> · Tu capital: <b>ALIADA</b> · Reinos enemigos restantes: <b>'+conquestRealms.length+'</b> · Objetivo: conquista los puestos de un reino enemigo y después su base.';
}

function conquestDraw(){
  if(!conquestActive||!conquestState)return;
  const s=conquestState,{cx,cy}=s,size=TILE*camera.zoom,bp=worldToScreen(cx*TILE+TILE/2,cy*TILE+TILE/2);
  ctx.save();ctx.fillStyle="rgba(30,105,67,.72)";ctx.strokeStyle="#8cf0b0";ctx.lineWidth=Math.max(2,2.5*camera.zoom);ctx.beginPath();ctx.roundRect(bp.x-size*.8,bp.y-size*.68,size*1.6,size*1.36,7*camera.zoom);ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff2c9";ctx.font="bold "+Math.max(10,14*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("TU REINO",bp.x,bp.y-size*.12);ctx.fillText("♛",bp.x,bp.y+size*.25);ctx.restore();
  for(const post of s.posts){const p=worldToScreen(post.x*TILE+TILE/2,post.y*TILE+TILE/2);ctx.save();ctx.fillStyle="#23864f";ctx.strokeStyle="#9af5b5";ctx.lineWidth=Math.max(1.5,2*camera.zoom);ctx.beginPath();ctx.arc(p.x,p.y,size*.42,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold "+Math.max(8,10*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("✓",p.x,p.y);ctx.restore();}
}

function conquestInstallHooks(){
  const originalValidCell=validCell;
  validCell=function(x,y,ignore=null){
    if(conquestActive&&conquestState){
      const wall=conquestIsWall(x,y);
      if(wall){
        if(wall.kind==="realm")return false;
        const breach=conquestState.outerBreach;
        if(!(wall.kind==="outer"&&conquestState.outerBreachOpen&&breach&&breach.x===x&&breach.y===y))return false;
      }
    }
    return originalValidCell(x,y,ignore);
  };
  const originalHandleClick=handleClick;
  handleClick=function(sx,sy){
    if(conquestHandleClick(sx,sy))return;
    return originalHandleClick(sx,sy);
  };
  const originalEnemyMove=enemyMove;
  enemyMove=function(army){if(conquestActive){conquestAiMove(army);return;}return originalEnemyMove(army);};
  const originalGetMoves=getMoves;
  getMoves=function(unit){const moves=originalGetMoves(unit);if(!conquestActive)return moves;return moves.filter(m=>{const t=units.find(v=>v.alive&&!v.deadAnimating&&v.x===m.x&&v.y===m.y);return !t||!conquestAreAllied(unit.army,t.army);});};
  const originalMoveUnit=moveUnit;
  moveUnit=function(unit,target){if(conquestActive){const t=units.find(v=>v.alive&&!v.deadAnimating&&v.x===target.x&&v.y===target.y);if(t&&conquestAreAllied(unit.army,t.army))return;}return originalMoveUnit(unit,target);};
  const originalCapture=capture;
  capture=function(a,d){if(conquestActive&&a&&d&&conquestAreAllied(a.army,d.army)){if(a.moving){a.x=a.moveStartX??a.x;a.y=a.moveStartY??a.y;a.renderX=a.x;a.renderY=a.y;a.moving=false;a.pendingEnemy=null;}return;}return originalCapture(a,d);};
  const originalUpdate=update;
  update=function(dt){
    originalUpdate(dt);
    if(conquestActive)conquestTick(dt);
  };
  const originalRestartGame=restartGame;
  restartGame=function(){
    originalRestartGame();
    if(conquestActive&&!conquestStartingNew){
      /* Reiniciar Conquista vuelve a quitar los ejércitos genéricos de Endless. */
      units=units.filter(u=>u.army===playerArmy);
      armies=[];
      conquestState=null;
      conquestBuildFortress();
      if(typeof gamePaused!=="undefined")gamePaused=false;
      window.gamePaused=false;
      conquestUpdateHud();
    }
  };
  /* Dibujar los castillos al FINAL del render, después de mapa y niebla.
     Así no pueden quedar tapados por el render del terreno. */
  const originalRender=render;
  render=function(){
    originalRender();
    if(conquestActive){
      conquestDraw();
      conquestOtherRealmsDraw();
    }
  };
  const playButton=document.getElementById("playButton");
  if(playButton){
    playButton.addEventListener("click",e=>{
      e.preventDefault();e.stopImmediatePropagation();
      conquestCreateModePicker();
      conquestModeOverlay.style.display="flex";
    },true);
  }
}


/* Reinos adicionales y diplomacia para el mundo territorial. */
let conquestRealms=[];
let conquestAllies=new Set();
let conquestDiplomacyPanel=null;

function conquestAreAllied(a,b){
  if(!a||!b)return false;
  if(a===b)return true;
  if(a===playerArmy)return conquestAllies.has(b.realmId);
  if(b===playerArmy)return conquestAllies.has(a.realmId);
  return !!(a.realmId&&b.realmId&&a.allianceId&&a.allianceId===b.allianceId);
}
function conquestOpenDiplomacy(){
  if(!conquestDiplomacyPanel){
    const p=document.createElement("div");
    p.style.cssText="position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;padding:18px;background:#071018cc;font-family:system-ui,Arial;color:#fff";
    p.innerHTML='<section style="width:min(520px,100%);max-height:85vh;overflow:auto;padding:24px;border:1px solid #d8bd79;border-radius:18px;background:linear-gradient(145deg,#1d3037,#101820)"><h2 style="color:#f0d181;margin-top:0">DIPLOMACIA DE LOS REINOS</h2><p style="color:#c2ccd2;font-size:13px">Forma alianzas para que ese reino no te ataque. Puedes romperlas cuando quieras.</p><div id="conquestDiplomacyList"></div><button id="conquestDiplomacyClose" style="margin-top:12px;width:100%;padding:11px;border:1px solid #62717b;border-radius:10px;background:#24333d;color:white;font-weight:800;cursor:pointer">VOLVER AL MAPA</button></section>';
    document.body.appendChild(p);
    p.querySelector("#conquestDiplomacyClose").onclick=()=>p.style.display="none";
    p.addEventListener("click",e=>{if(e.target===p)p.style.display="none";});
    conquestDiplomacyPanel=p;
  }
  const list=conquestDiplomacyPanel.querySelector("#conquestDiplomacyList");
  list.innerHTML="";
  conquestRealms.forEach(r=>{
    const allied=conquestAllies.has(r.id);
    const row=document.createElement("div");
    row.style.cssText="display:flex;align-items:center;gap:12px;padding:12px;margin:9px 0;border:1px solid #465661;border-radius:12px;background:#15232b";
    row.innerHTML='<span style="width:12px;height:38px;border-radius:6px;background:'+r.color+'"></span><div style="flex:1"><b>'+r.name+'</b><div style="font-size:12px;color:#c0cbd1">'+(allied?"Aliado: no te atacará":"Reino independiente")+'</div></div><button style="padding:9px;border-radius:8px;border:1px solid #d6b968;background:#3a3323;color:#fff;cursor:pointer;font-weight:800">'+(allied?"ROMPER ALIANZA":"PROPONER ALIANZA")+'</button>';
    row.querySelector("button").onclick=()=>{allied?conquestAllies.delete(r.id):conquestAllies.add(r.id);showMessage(allied?"⚔️ Alianza rota con "+r.name:"🤝 Alianza firmada con "+r.name);conquestOpenDiplomacy();};
    list.appendChild(row);
  });
  conquestDiplomacyPanel.style.display="flex";
}
function conquestEnsureDiplomacyButton(){
  if(document.getElementById("conquestDiplomacyButton"))return;
  const b=document.createElement("button");b.id="conquestDiplomacyButton";b.type="button";b.textContent="🤝 DIPLOMACIA";
  b.style.cssText="position:fixed;right:12px;top:12px;z-index:10010;display:none;padding:10px 13px;border:1px solid #d8bd79;border-radius:10px;background:#17272f;color:#fff1c9;font:800 11px system-ui;cursor:pointer";
  b.onclick=conquestOpenDiplomacy;document.body.appendChild(b);
}
function conquestBuildOtherRealms(){
  conquestRealms=[];conquestAllies=new Set();
  const pk=units.find(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&u.type==="king");if(!pk)return;
  /* Reinos cercanos a la capital para que el jugador vea castillos y fronteras al entrar. */
  const specs=[
    {id:"verdant",name:"Reino Esmeralda",x:clamp(pk.x+11,12,MAP_W-13),y:clamp(pk.y-6,12,MAP_H-12),color:"#4fa66b"},
    {id:"dune",name:"Sultanato de Dunas",x:clamp(pk.x-11,12,MAP_W-13),y:clamp(pk.y+5,12,MAP_H-12),color:"#d4a04f"},
    {id:"ember",name:"Reino Carmesí",x:clamp(pk.x+10,12,MAP_W-13),y:clamp(pk.y+7,12,MAP_H-12),color:"#cf5b56"}
  ];
  for(const s of specs){
    if(Math.hypot(s.x-pk.x,s.y-pk.y)<10)continue;
    const army={id:"realm-"+s.id,realmId:s.id,name:s.name,color:s.color,coins:350,xp:0,level:3,lives:3,score:0};
    armies.push(army);
    const r={...s,army,baseHP:100,baseCaptured:false,posts:[[s.x,s.y-4],[s.x,s.y+4],[s.x-4,s.y],[s.x+4,s.y]].map((p,i)=>({id:s.id+"-post-"+i,x:p[0],y:p[1],owner:army,progress:0,progressArmy:null}))};
    conquestRealms.push(r);
    const spawn=(x,y,t)=>{const q=conquestFindSpawn(x,y);if(q)createUnit(t,army,q.x,q.y);};
    spawn(s.x,s.y,"king");spawn(s.x-2,s.y,"rook");spawn(s.x+2,s.y,"rook");spawn(s.x,s.y-2,"knight");spawn(s.x,s.y+2,"bishop");spawn(s.x-1,s.y+1,"pawn");spawn(s.x+1,s.y-1,"pawn");
  }
  conquestEnsureDiplomacyButton();
}

function conquestOtherRealmsDraw(){
  if(!conquestActive)return;
  const size=TILE*camera.zoom;
  for(const r of conquestRealms){
    /* Frontera territorial amplia y translúcida, distinta para cada reino. */
    const left=Math.max(0,r.x-9),right=Math.min(MAP_W-1,r.x+9),top=Math.max(0,r.y-8),bottom=Math.min(MAP_H-1,r.y+8);
    ctx.save();
    ctx.globalAlpha=.12;ctx.fillStyle=r.color;
    const a=worldToScreen(left*TILE,top*TILE),b=worldToScreen((right+1)*TILE,(bottom+1)*TILE);
    ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
    ctx.globalAlpha=.78;ctx.strokeStyle=r.color;ctx.lineWidth=Math.max(2,2.5*camera.zoom);ctx.setLineDash([8*camera.zoom,5*camera.zoom]);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.setLineDash([]);
    ctx.restore();
    /* Muralla del castillo con cuatro puertas claramente visibles. */
    for(let y=r.y-5;y<=r.y+5;y++)for(let x=r.x-5;x<=r.x+5;x++){
      if(!inBounds(x,y)||!(Math.abs(x-r.x)===5&&Math.abs(y-r.y)<=5||Math.abs(y-r.y)===5&&Math.abs(x-r.x)<=5)||conquestRealmGate(r,x,y))continue;
      const p=worldToScreen(x*TILE,y*TILE);ctx.save();ctx.fillStyle=r.color;ctx.strokeStyle="#f0dba4";ctx.globalAlpha=.96;ctx.lineWidth=Math.max(1.5,1.6*camera.zoom);ctx.fillRect(p.x+size*.08,p.y+size*.08,size*.84,size*.84);ctx.strokeRect(p.x+size*.08,p.y+size*.08,size*.84,size*.84);ctx.restore();
    }
    const p=worldToScreen(r.x*TILE+TILE/2,r.y*TILE+TILE/2);
    ctx.save();ctx.fillStyle="#18232b";ctx.strokeStyle=r.color;ctx.lineWidth=Math.max(2.5,3.5*camera.zoom);ctx.beginPath();ctx.roundRect(p.x-size*1.18,p.y-size*.88,size*2.36,size*1.76,7*camera.zoom);ctx.fill();ctx.stroke();
    ctx.fillStyle="#fff2c9";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.max(10,12*camera.zoom)+"px Arial";ctx.fillText(r.name,p.x,p.y-size*.24);
    ctx.font="bold "+Math.max(11,15*camera.zoom)+"px Arial";ctx.fillText("♛",p.x,p.y+size*.12);
    ctx.font="bold "+Math.max(9,10*camera.zoom)+"px Arial";ctx.fillText("BASE "+r.baseHP+"%",p.x,p.y+size*.52);ctx.restore();
    for(const post of r.posts){
      const q=worldToScreen(post.x*TILE+TILE/2,post.y*TILE+TILE/2),owned=post.owner===playerArmy;
      ctx.save();ctx.fillStyle=owned?"#51c878":r.color;ctx.strokeStyle="#fff0bf";ctx.lineWidth=Math.max(1.5,2*camera.zoom);ctx.globalAlpha=.98;ctx.beginPath();ctx.arc(q.x,q.y,size*.58,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="bold "+Math.max(9,11*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(owned?"✓":"⚑",q.x,q.y);
      if(post.progress>0){ctx.strokeStyle="#fff0a6";ctx.lineWidth=Math.max(2,3*camera.zoom);ctx.beginPath();ctx.arc(q.x,q.y,size*.78,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,post.progress/3));ctx.stroke();}
      ctx.restore();
    }
  }
}

function conquestAiMove(army){
  const own=units.filter(u=>u.alive&&!u.deadAnimating&&u.army===army&&!u.moving&&!isUnitFrozen(u));
  if(!own.length)return;
  const enemies=units.filter(u=>u.alive&&!u.deadAnimating&&u.army!==army&&!conquestAreAllied(army,u.army));
  const visible=enemies.filter(t=>canArmySeeUnit(army,t));
  const goals=[];
  const addGoal=(x,y,owner)=>{
    if(!owner||owner===army||conquestAreAllied(army,owner))return;
    goals.push({x,y,owner});
  };
  if(conquestState){
    for(const post of conquestState.posts){
      const owner=post.owner==="player"?playerArmy:conquestState.defenders;
      addGoal(post.x,post.y,owner);
    }
  }
  for(const realm of conquestRealms){
    for(const post of realm.posts)addGoal(post.x,post.y,post.owner);
  }
  /* Las unidades persiguen enemigos visibles; si no los ven, avanzan
     hacia puestos hostiles para disputar territorio en vez de vagar al azar. */
  const u=own[Math.floor(Math.random()*own.length)];
  let moves=getMoves(u).filter(m=>{
    const t=units.find(v=>v.alive&&!v.deadAnimating&&v.x===m.x&&v.y===m.y);
    return !t||!conquestAreAllied(army,t.army);
  });
  if(!moves.length)return;
  const targets=visible.length?visible:goals;
  if(targets.length){
    const distance=(p)=>Math.min(...targets.map(t=>Math.hypot(p.x-t.x,p.y-t.y)));
    moves.sort((a,b)=>distance(a)-distance(b));
    const current=distance(u);
    const best=distance(moves[0]);
    /* No se fuerza un movimiento que aleje de todos los objetivos. */
    if(best<=current)moveUnit(u,moves[0]);
    else if(!visible.length){
      /* Si una muralla bloquea el camino directo, prueba otra casilla legal. */
      const alternatives=moves.filter(m=>distance(m)<current+1.5);
      if(alternatives.length)moveUnit(u,alternatives[0]);
    }
  }else{
    moveUnit(u,moves[Math.floor(Math.random()*moves.length)]);
  }
}

/* El script se carga con defer al final del HTML: los elementos ya existen. Instalar ahora evita que el selector dependa de DOMContentLoaded. */
conquestInstallHooks();
