"use strict";

const KINGDOMS=[
  {id:"green",name:"Reino Verde",icon:"🌱",price:0,description:"Tu reino inicial."},
  {id:"desert",name:"Reino Desértico",icon:"🏜️",price:500,description:"Dunas y arena."},
  {id:"volcanic",name:"Reino Volcánico",icon:"🌋",price:1000,description:"Ceniza, roca y lava."},
  {id:"shadows",name:"Reino de las Sombras",icon:"🌑",price:2000,description:"Un territorio oscuro."},
  {id:"ice",name:"Reino de Hielo",icon:"❄️",price:3000,description:"Un reino cubierto de hielo."},
  {id:"void",name:"Reino del Vacío",icon:"🌌",price:5000,description:"El reino más raro."}
];

let unlockedKingdoms=["green"];
let selectedKingdom="green";

function kingdomProgressSnapshot(){
  return {unlockedKingdoms:[...unlockedKingdoms],selectedKingdom};
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
  const open=document.getElementById("marketButton");
  const close=document.getElementById("closeMarket");
  const market=document.getElementById("kingdomMarket");
  if(open)open.addEventListener("click",openKingdomMarket);
  if(close)close.addEventListener("click",closeKingdomMarket);
  if(market)market.addEventListener("click",e=>{if(e.target===market)closeKingdomMarket();});
  renderKingdomMarket();
  setupGameStoreButton();
});
