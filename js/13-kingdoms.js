"use strict";

const KINGDOMS=[
  {id:"green",name:"Reino Verde",icon:"🌱",price:0,description:"Ejército equilibrado. Sin ninguna habilidad especial."},
  {id:"desert",name:"Reino Desértico",icon:"🏜️",price:500,description:"Tus piezas tienen mayor visión y detectan enemigos desde más lejos."},
  {id:"volcanic",name:"Reino Volcánico",icon:"🌋",price:1000,description:"Cada baja que consigues reduce el cooldown de tus piezas."},
  {id:"shadows",name:"Reino de las Sombras",icon:"🌑",price:2000,description:"Cuando tu Rey va a ser capturado, intercambia su posición con otra pieza aliada y obtiene un cooldown de 10 segundos."},
  {id:"ice",name:"Reino de Hielo",icon:"❄️",price:3000,description:"Cuando eliminas a un enemigo, un enemigo aleatorio cercano dentro de un área de 3×3 queda inmovilizado."},
  {id:"void",name:"Reino del Vacío",icon:"🌌",price:5000,description:"Misterioso :D"}
];

let unlockedKingdoms=["green"];
let selectedKingdom="green";

/* Habilidades de ejército:
   Vacío combina Desértico + Volcánico + Sombras. */
const VOID_FUSION=["desert","volcanic","shadows"];

function kingdomProgressSnapshot(){
  return {
    unlockedKingdoms:[...unlockedKingdoms],
    selectedKingdom
  };
}

function getSelectedKingdom(){
  return selectedKingdom;
}

function getUnitVision(unit){
  if(!unit||!unit.type)return 0;

  const base=PIECES[unit.type]?.vision||0;

  return (
    selectedKingdom==="desert"||
    selectedKingdom==="void"
  )
    ?base+2
    :base;
}

function getUnitCooldown(unit){
  if(!unit||!unit.type)return 0;

  const base=PIECES[unit.type]?.cooldown||0;

  if(
    selectedKingdom!=="volcanic"&&
    selectedKingdom!=="void"
  ){
    return base;
  }

  const kills=Math.max(
    0,
    Number(
      typeof volcanicKills!=="undefined"
      ?volcanicKills
      :0
    )||0
  );

  /* -3% por kill, con un máximo de -35%. */
  const reduction=Math.min(.35,kills*.03);

  return base*(1-reduction);
}

const ICE_FREEZE_DURATION=3000;

function isUnitFrozen(unit){
  return Boolean(
    unit&&
    Number(unit.frozenUntil||0)>Date.now()
  );
}

function tryShadowRescue(defender,attacker){

  if(
    !defender||
    defender.army!==playerArmy||
    defender.type!=="king"||
    !["shadows","void"].includes(selectedKingdom)
  ){
    return false;
  }

  const candidates=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    !u.moving&&
    u.army===playerArmy&&
    u.type!=="king"
  );

  /* Sin otra pieza aliada no puede producirse el intercambio. */
  if(!candidates.length)return false;

  const replacement=
    candidates[
      Math.floor(Math.random()*candidates.length)
    ];

  const oldKingX=defender.x;
  const oldKingY=defender.y;

  defender.x=replacement.x;
  defender.y=replacement.y;
  defender.renderX=defender.x;
  defender.renderY=defender.y;
  defender.cooldown=10;
  defender.pendingEnemy=null;

  replacement.x=oldKingX;
  replacement.y=oldKingY;
  replacement.renderX=replacement.x;
  replacement.renderY=replacement.y;
  replacement.pendingEnemy=null;

  /*
    El atacante vuelve a su posición anterior y el intento
    de captura queda cancelado para evitar solapamientos.
  */
  if(attacker){
    attacker.x=attacker.attackOriginX??attacker.x;
    attacker.y=attacker.attackOriginY??attacker.y;
    attacker.renderX=attacker.x;
    attacker.renderY=attacker.y;
    attacker.moving=false;
    attacker.pendingEnemy=null;
  }

  selectedUnit=null;

  showMessage("🌑 ¡El Rey escapó mediante un intercambio!");

  return true;
}

function applyIceFreeze(deadEnemy){

  if(
    !deadEnemy||
    deadEnemy.army===playerArmy||
    !["ice","void"].includes(selectedKingdom)
  ){
    return;
  }

  const candidates=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army!==playerArmy&&
    Math.max(
      Math.abs(u.x-deadEnemy.x),
      Math.abs(u.y-deadEnemy.y)
    )<=1
  );

  if(!candidates.length)return;

  const frozen=
    candidates[
      Math.floor(Math.random()*candidates.length)
    ];

  frozen.frozenUntil=
    Date.now()+ICE_FREEZE_DURATION;

  showMessage("❄️ ¡Un enemigo ha quedado congelado!");
}

function restoreKingdomProgress(d){
  unlockedKingdoms=Array.isArray(d&&d.unlockedKingdoms)?d.unlockedKingdoms:["green"];
  if(!unlockedKingdoms.includes("green"))unlockedKingdoms.unshift("green");
  selectedKingdom=d&&d.selectedKingdom||"green";
  if(!unlockedKingdoms.includes(selectedKingdom))selectedKingdom="green";
}

function renderKingdomMarket(){
  const balance=document.getElementById("marketDiamonds");
  const grid=document.getElementById("kingdomGrid");
  if(!balance||!grid)return;
  balance.textContent=globalDiamonds;
  grid.innerHTML="";
  KINGDOMS.forEach(k=>{
    const unlocked=unlockedKingdoms.includes(k.id);
    const card=document.createElement("article");
    card.className="kingdomCard"+(selectedKingdom===k.id?" active":"");
    card.innerHTML="<div class='kingdomIcon'>"+k.icon+"</div><h3>"+k.name+"</h3><p>"+k.description+"</p><div class='kingdomPrice'>"+(unlocked?"DESBLOQUEADO":k.price+" 💎")+"</div>";
    const button=document.createElement("button");
    button.className="kingdomAction";
    if(selectedKingdom===k.id){button.textContent="✓ SELECCIONADO";button.disabled=true;}
    else if(unlocked){button.textContent="ELEGIR";}
    else{button.textContent=k.price+" 💎";button.disabled=globalDiamonds<k.price;}
    button.addEventListener("click",()=>{
      if(unlocked) selectedKingdom=k.id;
      else{
        if(globalDiamonds<k.price)return;
        globalDiamonds-=k.price;
        unlockedKingdoms.push(k.id);
        selectedKingdom=k.id;
      }
      saveProgress();
      renderKingdomMarket();
      showMessage("👑 "+k.name+" seleccionado");
    });
    card.appendChild(button);
    grid.appendChild(card);
  });
}

function setupGameStoreButton(){
  const button=document.getElementById("gameStoreButton");
  if(button)button.addEventListener("click",openKingdomMarket);
}

function openKingdomMarket(){
  const market=document.getElementById("kingdomMarket");
  if(!market)return;
  market.style.display="flex";
  renderKingdomMarket();
}

function closeKingdomMarket(){
  const market=document.getElementById("kingdomMarket");
  if(market)market.style.display="none";
}

document.addEventListener("DOMContentLoaded",()=>{
  if(window.pendingKingdomProgress){
    restoreKingdomProgress(window.pendingKingdomProgress);
    delete window.pendingKingdomProgress;
  }

  const open=document.getElementById("marketButton");
  const close=document.getElementById("closeMarket");
  const market=document.getElementById("kingdomMarket");
  if(open)open.addEventListener("click",openKingdomMarket);
  if(close)close.addEventListener("click",closeKingdomMarket);
  if(market)market.addEventListener("click",e=>{if(e.target===market)closeKingdomMarket();});
  renderKingdomMarket();
  setupGameStoreButton();
});
