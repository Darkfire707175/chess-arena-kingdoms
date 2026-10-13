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
    '#conquestHud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:30;display:none;max-width:min(720px,calc(100vw - 24px));padding:10px 15px;border:1px solid #d8b967;border-radius:12px;background:rgba(12,22,25,.91);color:#fff1c9;text-align:center;box-shadow:0 8px 25px #0006;font:700 12px/1.5 system-ui,Arial,sans-serif;pointer-events:none}'+
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
  conquestActive=true;
  conquestState=null;
  if(typeof restartGame==="function"){
    conquestStartingNew=true;
    restartGame();
    conquestStartingNew=false;
  }
  else{
    const start=document.getElementById("startScreen");
    if(start)start.style.display="none";
  }
  conquestBuildFortress();
  if(typeof gamePaused!=="undefined")gamePaused=false;
  window.gamePaused=false;
  const pause=document.getElementById("pauseOverlay");
  if(pause)pause.style.display="none";
  const button=document.getElementById("pauseGameButton");
  if(button)button.textContent="⚙️";
  showMessage("🏰 ¡Asalto iniciado! Destruye un tramo de la muralla exterior.");
  conquestUpdateHud();
  if(typeof saveProgress==="function")saveProgress();
}

function conquestBuildFortress(){
  const king=units.find(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&u.type==="king");
  if(!king)return;
  /* El objetivo aparece delante del Rey, dejando espacio para avanzar. */
  const direction=king.x<MAP_W-25?1:-1;
  const cx=clamp(king.x+direction*17,11,MAP_W-12);
  const cy=clamp(king.y,10,MAP_H-11);
  conquestState={
    cx,cy,direction,
    outerHP:5,
    baseHP:100,
    innerOpen:false,
    posts:[
      {id:"north",x:cx,y:cy-5,label:"Puesto Norte",owner:"defender",progress:0,progressArmy:null},
      {id:"south",x:cx,y:cy+5,label:"Puesto Sur",owner:"defender",progress:0,progressArmy:null},
      {id:"west",x:cx-5,y:cy,label:"Puesto Oeste",owner:"defender",progress:0,progressArmy:null},
      {id:"east",x:cx+5,y:cy,label:"Puesto Este",owner:"defender",progress:0,progressArmy:null}
    ],
    defenders:null,
    won:false
  };

  /* La partida de conquista tiene un solo reino defensor. */
  units=units.filter(u=>u.army===playerArmy);
  armies=[];
  const defender={
    id:"conquest-defender",
    name:"Reino Defensor",
    color:"#c34a4d",
    coins:500,xp:0,level:3,lives:3,score:0
  };
  armies.push(defender);
  conquestState.defenders=defender;

  /* Garrison: una pieza defiende cada puesto y el centro. */
  for(const post of conquestState.posts){
    const cell=conquestFindSpawn(post.x,post.y);
    if(cell)createUnit("rook",defender,cell.x,cell.y);
  }
  const kingCell=conquestFindSpawn(cx,cy);
  if(kingCell)createUnit("king",defender,kingCell.x,kingCell.y);
  for(const [dx,dy,type] of [[-2,0,"knight"],[2,0,"knight"],[0,-2,"bishop"],[0,2,"bishop"]]){
    const cell=conquestFindSpawn(cx+dx,cy+dy);
    if(cell)createUnit(type,defender,cell.x,cell.y);
  }
  camera.x=king.x*TILE+TILE/2;
  camera.y=king.y*TILE+TILE/2;
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
  if(!conquestActive||!conquestState)return[];
  const s=conquestState,{cx,cy}=s;
  const cells=[];
  for(let x=cx-8;x<=cx+8;x++){
    cells.push({x,y:cy-8,kind:"outer"},{x,y:cy+8,kind:"outer"});
  }
  for(let y=cy-7;y<=cy+7;y++){
    cells.push({x:cx-8,y,kind:"outer"},{x:cx+8,y,kind:"outer"});
  }
  if(!s.innerOpen){
    for(let x=cx-3;x<=cx+3;x++){
      cells.push({x,y:cy-3,kind:"inner"},{x,y:cy+3,kind:"inner"});
    }
    for(let y=cy-2;y<=cy+2;y++){
      cells.push({x:cx-3,y,kind:"inner"},{x:cx+3,y,kind:"inner"});
    }
  }
  return cells.filter(c=>inBounds(c.x,c.y));
}

function conquestIsWall(x,y){
  return conquestWallCells().find(c=>c.x===x&&c.y===y)||null;
}

function conquestCanEnter(x,y){
  return !conquestIsWall(x,y);
}

function conquestHasFriendlyNear(x,y){
  return units.some(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&Math.max(Math.abs(u.x-x),Math.abs(u.y-y))<=1);
}

function conquestHandleClick(sx,sy){
  if(!conquestActive||!conquestState)return false;
  const world=screenToWorld(sx,sy);
  const cell=tileAtWorld(world.x,world.y);
  if(!inBounds(cell.x,cell.y))return false;
  const wall=conquestIsWall(cell.x,cell.y);
  if(wall){
    if(!conquestHasFriendlyNear(cell.x,cell.y)){
      showMessage("⚔️ Acerca una pieza a la muralla para atacarla.");
      return true;
    }
    if(wall.kind==="outer"){
      conquestState.outerHP--;
      showMessage(conquestState.outerHP>0
        ?"🧱 Muralla exterior: "+conquestState.outerHP+" impactos restantes."
        :"💥 ¡Brecha abierta en la muralla exterior!");
      if(conquestState.outerHP<=0){
        /* Abre un portillo en el tramo atacado. */
        conquestState.outerBreach={x:cell.x,y:cell.y};
      }
    }else{
      if(!conquestState.posts.every(p=>p.owner==="player")){
        showMessage("🔒 La muralla interior sigue cerrada: conquista todos los puestos.");
      }else{
        conquestState.innerOpen=true;
        showMessage("🏰 ¡La muralla interior se ha abierto!");
      }
    }
    conquestUpdateHud();
    return true;
  }

  if(Math.abs(cell.x-conquestState.cx)<=1&&Math.abs(cell.y-conquestState.cy)<=1){
    if(!conquestState.posts.every(p=>p.owner==="player")){
      showMessage("🔒 La base está protegida. Conquista primero todos los puestos.");
      return true;
    }
    if(!conquestState.innerOpen){
      conquestState.innerOpen=true;
      showMessage("🏰 ¡La muralla interior se ha abierto!");
      return true;
    }
    if(!conquestHasFriendlyNear(cell.x,cell.y)){
      showMessage("⚔️ Acerca una pieza a la base principal para atacarla.");
      return true;
    }
    conquestState.baseHP=Math.max(0,conquestState.baseHP-10);
    showMessage("👑 Base principal: "+conquestState.baseHP+"% de resistencia.");
    if(conquestState.baseHP===0){
      conquestState.won=true;
      conquestActive=false;
      gameEnded=true;
      showMessage("🏆 ¡Victoria! Has conquistado el reino.");
      const over=document.getElementById("gameOver");
      const text=document.getElementById("gameOverText");
      if(text)text.textContent="¡Has destruido la base principal y conquistado el reino!";
      if(over)over.style.display="flex";
    }
    conquestUpdateHud();
    if(typeof saveProgress==="function")saveProgress();
    return true;
  }
  return false;
}

function conquestTick(dt){
  if(!conquestActive||!conquestState||conquestState.won)return;
  const s=conquestState;
  const breach=s.outerBreach;
  /* Solo se puede cruzar por el tramo de muralla destruido. */
  if(breach){
    const wallIndex=conquestWallCells().findIndex(c=>c.x===breach.x&&c.y===breach.y);
    if(wallIndex>=0){
      /* El portillo deja de bloquearse aunque el dibujo de muro continúe. */
      s.outerBreachOpen=true;
    }
  }
  const postsDone=s.posts.every(p=>p.owner==="player");
  if(postsDone&&!s.innerOpen){
    s.innerOpen=true;
    showMessage("🏰 ¡Todos los puestos conquistados! La muralla interior se abre.");
  }
  for(const post of s.posts){
    const playerInside=units.some(u=>u.alive&&!u.deadAnimating&&u.army===playerArmy&&Math.max(Math.abs(u.x-post.x),Math.abs(u.y-post.y))<=1);
    const defenderInside=units.some(u=>u.alive&&!u.deadAnimating&&u.army===s.defenders&&Math.max(Math.abs(u.x-post.x),Math.abs(u.y-post.y))<=1);
    if(playerInside&&defenderInside){
      post.progress=0;post.progressArmy=null;
      continue;
    }
    const side=playerInside?"player":defenderInside?"defender":null;
    if(!side){
      post.progress=0;post.progressArmy=null;
      continue;
    }
    if(post.progressArmy!==side){post.progress=0;post.progressArmy=side;}
    post.progress+=dt;
    if(post.progress>=3){
      post.owner=side;
      post.progress=0;
      post.progressArmy=null;
      showMessage(side==="player"?"🏴 ¡"+post.label+" conquistado!":"🛡️ ¡"+post.label+" reconquistado por los defensores!");
      if(side==="defender"){
        s.innerOpen=false;
      }
      conquestUpdateHud();
    }
  }
  conquestUpdateHud();
}

function conquestUpdateHud(){
  const hud=document.getElementById("conquestHud");
  if(!hud)return;
  if(!conquestActive||!conquestState){hud.style.display="none";return;}
  const captured=conquestState.posts.filter(p=>p.owner==="player").length;
  const breach=conquestState.outerBreachOpen?"abierta":"cerrada";
  hud.style.display="block";
  hud.innerHTML='🏰 <b>CONQUISTA</b> · Muralla exterior: <b>'+(conquestState.outerHP<=0?"brecha":"intacta")+'</b> · Puestos: <b>'+captured+'/'+conquestState.posts.length+'</b> · Muralla interior: <b>'+(conquestState.innerOpen?"ABIERTA":"CERRADA")+'</b> · Base: <b>'+conquestState.baseHP+'%</b>';
}

function conquestDraw(){
  if(!conquestActive||!conquestState)return;
  const s=conquestState,{cx,cy}=s;
  const size=TILE*camera.zoom;
  const drawTileBadge=(x,y,fill,stroke,text)=>{
    const p=worldToScreen(x*TILE+TILE/2,y*TILE+TILE/2);
    ctx.save();
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(1,2*camera.zoom);
    ctx.beginPath();ctx.roundRect(p.x-size*.42,p.y-size*.36,size*.84,size*.72,5*camera.zoom);ctx.fill();ctx.stroke();
    ctx.fillStyle="#fff5d9";ctx.font="bold "+Math.max(8,10*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,p.x,p.y);ctx.restore();
  };
  /* Puestos visibles incluso desde lejos, como objetivos tácticos. */
  for(const post of s.posts){
    const p=worldToScreen(post.x*TILE+TILE/2,post.y*TILE+TILE/2);
    ctx.save();
    ctx.globalAlpha=.88;
    ctx.fillStyle=post.owner==="player"?"rgba(57,153,96,.22)":"rgba(177,58,58,.22)";
    ctx.strokeStyle=post.owner==="player"?"#75e39c":"#ed7979";
    ctx.lineWidth=Math.max(1.4,2*camera.zoom);
    ctx.beginPath();ctx.arc(p.x,p.y,size*1.05,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=post.owner==="player"?"#80e4a0":"#ffaaaa";
    ctx.font="bold "+Math.max(10,13*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(post.owner==="player"?"✓":"⚑",p.x,p.y);
    if(post.progress>0){
      ctx.strokeStyle=post.progressArmy==="player"?"#8cf0b0":"#ffcf70";
      ctx.lineWidth=Math.max(2,3*camera.zoom);
      ctx.beginPath();ctx.arc(p.x,p.y,size*1.24,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,post.progress/3));ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="bold "+Math.max(9,11*camera.zoom)+"px Arial";
      ctx.fillText((3-post.progress).toFixed(1)+"s",p.x,p.y+size*.55);
    }
    ctx.restore();
  }
  /* Murallas: bloques dibujados en cada casilla. */
  for(const wall of conquestWallCells()){
    const isOuter=wall.kind==="outer";
    if(isOuter&&s.outerBreachOpen&&s.outerBreach&&wall.x===s.outerBreach.x&&wall.y===s.outerBreach.y)continue;
    const p=worldToScreen(wall.x*TILE,wall.y*TILE);
    ctx.save();
    ctx.fillStyle=isOuter?"#5d6871":"#4a505c";
    ctx.strokeStyle=isOuter?"#d8bd79":"#b7a6c6";
    ctx.lineWidth=Math.max(1,1.5*camera.zoom);
    ctx.fillRect(p.x+size*.06,p.y+size*.08,size*.88,size*.82);
    ctx.strokeRect(p.x+size*.06,p.y+size*.08,size*.88,size*.82);
    ctx.fillStyle="rgba(255,255,255,.12)";
    ctx.fillRect(p.x+size*.12,p.y+size*.14,size*.76,size*.12);
    ctx.restore();
  }
  /* Fortaleza principal. */
  const bp=worldToScreen(cx*TILE+TILE/2,cy*TILE+TILE/2);
  ctx.save();
  ctx.fillStyle="#252b35";ctx.strokeStyle="#f0cf79";ctx.lineWidth=Math.max(2,3*camera.zoom);
  ctx.beginPath();ctx.roundRect(bp.x-size*.95,bp.y-size*.85,size*1.9,size*1.7,7*camera.zoom);ctx.fill();ctx.stroke();
  ctx.fillStyle="#e7c66e";ctx.font="bold "+Math.max(12,16*camera.zoom)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("♛",bp.x,bp.y-size*.04);
  ctx.fillStyle="#fff";ctx.font="bold "+Math.max(8,10*camera.zoom)+"px Arial";ctx.fillText(s.baseHP+"%",bp.x,bp.y+size*.48);
  ctx.restore();
}

function conquestInstallHooks(){
  const originalValidCell=validCell;
  validCell=function(x,y,ignore=null){
    if(conquestActive&&conquestState){
      const wall=conquestIsWall(x,y);
      if(wall){
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
  const originalUpdate=update;
  update=function(dt){
    originalUpdate(dt);
    if(conquestActive)conquestTick(dt);
  };
  const originalRestartGame=restartGame;
  restartGame=function(){
    originalRestartGame();
    if(conquestActive&&!conquestStartingNew){
      conquestState=null;
      conquestBuildFortress();
      if(typeof gamePaused!=="undefined")gamePaused=false;
      window.gamePaused=false;
      conquestUpdateHud();
    }
  };
  const originalDrawMap=drawMap;
  drawMap=function(){
    originalDrawMap();
    conquestDraw();
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

document.addEventListener("DOMContentLoaded",conquestInstallHooks);
