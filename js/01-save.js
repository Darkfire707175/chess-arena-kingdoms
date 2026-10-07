"use strict";

const startScreen=document.getElementById("startScreen");
const googleStatus=document.getElementById("googleStatus");
const FIREBASE_CONFIG={
  apiKey:"AIzaSyAOWbwtxXaAe1SK-D--aIlbU6DtoT1pVw0",
  authDomain:"chess-arena-c7ca1.firebaseapp.com",
  projectId:"chess-arena-c7ca1",
  appId:"1:257471638012:web:760545f02d75a4197cea79"
};
let firebaseReady=false,cloudUser=null,saveBusy=false,saveQueued=false;
let globalDiamonds=0;
const localSaveKey="chessArenaKingdoms_save_v1";

function hasFirebaseConfig(){
  return FIREBASE_CONFIG.apiKey&&FIREBASE_CONFIG.authDomain&&FIREBASE_CONFIG.projectId&&FIREBASE_CONFIG.appId;
}

function initFirebase(){
  if(!window.firebase||!hasFirebaseConfig()){
    googleStatus.textContent="Firebase no está cargado.";
    return;
  }
  try{
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    window.caAuth=firebase.auth();
    window.caDb=firebase.firestore();
    firebaseReady=true;
    window.caAuth.onAuthStateChanged(async user=>{
      cloudUser=user||null;
      if(user){
        googleStatus.textContent="Conectado como "+(user.displayName||user.email)+". Sincronizando…";
        await loadCloudSave();
        googleStatus.textContent="Cuenta conectada: "+(user.displayName||user.email)+". Progreso sincronizado.";
        saveProgress();
      }else{
        googleStatus.textContent="Puedes jugar sin conectar una cuenta.";
      }
    });
  }catch(e){
    console.error("Firebase:",e);
    firebaseReady=false;
    googleStatus.textContent="Error iniciando Firebase.";
  }
}

function safeArmy(a){return {id:a.id,name:a.name,color:a.color,coins:a.coins,xp:a.xp,level:a.level,lives:a.lives,score:a.score};}
function saveSnapshot(){
  const armyList=[playerArmy,...armies].filter((a,i,arr)=>arr.indexOf(a)===i);
  return {version:1,savedAt:Date.now(),diamonds:Math.max(0,Number(globalDiamonds)||0),player:safeArmy(playerArmy),armies:armyList.map(safeArmy),units:units.map(u=>({id:u.id,type:u.type,armyId:u.army?.id,x:u.x,y:u.y,renderX:u.renderX,renderY:u.renderY,alive:u.alive,moving:u.moving,deadAnimating:u.deadAnimating,moveStartX:u.moveStartX,moveStartY:u.moveStartY,moveTargetX:u.moveTargetX,moveTargetY:u.moveTargetY,moveProgress:u.moveProgress,moveDuration:u.moveDuration,cooldown:u.cooldown})),spawnType,gameEnded};
}
function restoreSnapshot(d){
  if(!d||d.version!==1||!d.player||!Array.isArray(d.units))return false;
  globalDiamonds=Math.max(0,Number(d.diamonds)||0);
  const armyMap=new Map();for(const a of (d.armies||[]))armyMap.set(a.id,{...a});
  playerArmy=armyMap.get("player")||{...d.player};Object.assign(playerArmy,d.player);playerArmy.id="player";
  armies=Array.from(armyMap.values()).filter(a=>a.id!=="player");
  units=d.units.filter(u=>u&&typeof u.x==="number"&&typeof u.y==="number"&&armyMap.has(u.armyId)).map(u=>({...u,army:armyMap.get(u.armyId)}));
  spawnType=d.spawnType||"pawn";gameEnded=!!d.gameEnded;selectedUnit=null;
  let king=units.find(u=>u.army===playerArmy&&u.type==="king"&&u.alive&&!u.deadAnimating);
  if(!king){playerArmy.lives=Math.max(1,Number(playerArmy.lives)||3);gameEnded=false;createPlayer();king=units.find(u=>u.army===playerArmy&&u.type==="king"&&u.alive&&!u.deadAnimating);}
  if(king){camera.x=(king.moving?king.renderX:king.x)*TILE+TILE/2;camera.y=(king.moving?king.renderY:king.y)*TILE+TILE/2;}
  updatePieceButtons();updateUI();render();return true;
}
function saveProgress(){
  if(typeof playerArmy==="undefined"||!playerArmy)return;
  try{const data=saveSnapshot();localStorage.setItem(localSaveKey,JSON.stringify(data));}catch(e){console.warn("No se pudo guardar localmente",e);}
  if(cloudUser&&firebaseReady){
    if(saveBusy){saveQueued=true;return;}
    saveBusy=true;
    window.caDb.collection("chessArenaSaves").doc(cloudUser.uid).set(saveSnapshot()).catch(e=>{
      console.warn(e);googleStatus.textContent="Guardado local activo; error de nube.";
    }).finally(()=>{saveBusy=false;if(saveQueued){saveQueued=false;saveProgress();}});
  }
}
async function loadCloudSave(){
  try{
    const snap=await window.caDb.collection("chessArenaSaves").doc(cloudUser.uid).get();
    if(snap.exists){restoreSnapshot(snap.data());localStorage.setItem(localSaveKey,JSON.stringify(snap.data()));}
    else{const local=localStorage.getItem(localSaveKey);if(local)restoreSnapshot(JSON.parse(local));}
  }catch(e){console.warn(e);googleStatus.textContent="No se pudo leer la nube; se conserva el guardado local.";}
}
async function signInGoogle(){
  if(!firebaseReady){googleStatus.textContent="Firebase no está listo. Recarga la página.";return;}
  googleStatus.textContent="Abriendo Google…";
  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    await window.caAuth.signInWithPopup(provider);
  }catch(e){
    console.error("Google Sign-In:",e);
    googleStatus.textContent="Error de Google: "+(e.code||e.message||"desconocido");
  }
}

const startCrown=document.querySelector(".startCrown");
const adminHotspot=document.createElement("button");
adminHotspot.type="button";
adminHotspot.className="adminHotspot";
adminHotspot.setAttribute("aria-label","");
adminHotspot.title="";
if(startCrown&&startCrown.parentElement){
  startCrown.parentElement.appendChild(adminHotspot);
  adminHotspot.addEventListener("click",openAdminZone);
}
const adminZone=document.getElementById("adminZone");
const adminCodeInput=document.getElementById("adminCodeInput");
const adminCodeButton=document.getElementById("adminCodeButton");
const adminStatus=document.getElementById("adminStatus");
const adminBackButton=document.getElementById("adminBackButton");

function openAdminZone(){
  if(!adminZone)return;
  adminZone.style.display="flex";
  if(adminCodeInput){adminCodeInput.value="";adminCodeInput.focus();}
  if(adminStatus)adminStatus.textContent="";
}
function closeAdminZone(){
  if(adminZone)adminZone.style.display="none";
  if(adminCodeInput)adminCodeInput.value="";
  if(adminStatus)adminStatus.textContent="";
}
function redeemAdminCode(){
  if(!adminCodeInput)return;
  const code=adminCodeInput.value.trim().toLowerCase();
  if(code==="piyuesgay"){
    globalDiamonds=Math.max(0,Number(globalDiamonds)||0)+1000;
    saveProgress();
    updateUI();
    if(typeof renderKingdomMarket==="function")renderKingdomMarket();
    adminStatus.textContent="✓ +1000 💎 añadidos al reino.";
    adminCodeInput.value="";
    return;
  }
  adminStatus.textContent="ZONA DE ADMIN";
}
if(adminCodeButton)adminCodeButton.addEventListener("click",redeemAdminCode);
if(adminCodeInput)adminCodeInput.addEventListener("keydown",e=>{if(e.key==="Enter")redeemAdminCode();});
if(adminBackButton)adminBackButton.addEventListener("click",closeAdminZone);

const googleButton=document.getElementById("googleButton");
if(googleButton)googleButton.addEventListener("click",signInGoogle);
const playButton=document.getElementById("playButton");
if(playButton)playButton.addEventListener("click",()=>{startScreen.style.display="none";showMessage("👑 ¡Tu reino te espera!");saveProgress();});
window.addEventListener("beforeunload",saveProgress);
setInterval(saveProgress,5000);

initFirebase();
