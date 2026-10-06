"use strict";

/* Inicio de sesión Google + guardado local/nube. Configura tu proyecto Firebase. */
const startScreen=document.getElementById("startScreen");
const googleStatus=document.getElementById("googleStatus");
const FIREBASE_CONFIG={apiKey:"PEGA_AQUI_TU_API_KEY",authDomain:"TU_PROYECTO.firebaseapp.com",projectId:"TU_PROYECTO",appId:"PEGA_AQUI_TU_APP_ID"};
let firebaseReady=false, cloudUser=null, saveBusy=false, saveQueued=false;
const localSaveKey="chessArenaKingdoms_save_v1";
function hasFirebaseConfig(){return FIREBASE_CONFIG.apiKey!=="PEGA_AQUI_TU_API_KEY"&&FIREBASE_CONFIG.projectId!=="TU_PROYECTO"&&FIREBASE_CONFIG.appId!=="PEGA_AQUI_TU_APP_ID";}
if(window.firebase&&hasFirebaseConfig()){
  try{firebase.initializeApp(FIREBASE_CONFIG);firebaseReady=true;window.caAuth=firebase.auth();window.caDb=firebase.firestore();
    window.caAuth.onAuthStateChanged(async user=>{cloudUser=user||null;if(user){googleStatus.textContent="Conectado como "+(user.displayName||user.email)+". Sincronizando…";await loadCloudSave();googleStatus.textContent="Cuenta conectada: "+(user.displayName||user.email)+". Progreso sincronizado.";saveProgress();}else{googleStatus.textContent="Puedes jugar sin conectar una cuenta.";}});
  }catch(e){console.error(e);}}
function safeArmy(a){return {id:a.id,name:a.name,color:a.color,coins:a.coins,xp:a.xp,level:a.level,lives:a.lives,score:a.score};}
function saveSnapshot(){
  const armyList=[playerArmy,...armies].filter((a,i,arr)=>arr.indexOf(a)===i);
  return {version:1,savedAt:Date.now(),player:safeArmy(playerArmy),armies:armyList.map(safeArmy),units:units.map(u=>({id:u.id,type:u.type,armyId:u.army?.id,x:u.x,y:u.y,renderX:u.renderX,renderY:u.renderY,alive:u.alive,moving:u.moving,deadAnimating:u.deadAnimating,moveStartX:u.moveStartX,moveStartY:u.moveStartY,moveTargetX:u.moveTargetX,moveTargetY:u.moveTargetY,moveProgress:u.moveProgress,moveDuration:u.moveDuration,cooldown:u.cooldown})),spawnType,gameEnded};
}
function restoreSnapshot(d){
  if(!d||d.version!==1||!d.player||!Array.isArray(d.units))return false;
  const armyMap=new Map();for(const a of (d.armies||[])){armyMap.set(a.id,{...a});}
  playerArmy=armyMap.get("player")||{...d.player};Object.assign(playerArmy,d.player);playerArmy.id="player";
  armies=Array.from(armyMap.values()).filter(a=>a.id!=="player");
  units=d.units.filter(u=>u&&typeof u.x==="number"&&typeof u.y==="number"&&armyMap.has(u.armyId)).map(u=>({...u,army:armyMap.get(u.armyId)}));
  spawnType=d.spawnType||"pawn";gameEnded=!!d.gameEnded;selectedUnit=null;

  // Recuperación: un guardado antiguo o incompleto no debe borrar al Rey.
  let king=units.find(u=>u.army===playerArmy&&u.type==="king"&&u.alive&&!u.deadAnimating);
  if(!king){
    playerArmy.lives=Math.max(1,Number(playerArmy.lives)||3);
    gameEnded=false;
    createPlayer();
    king=units.find(u=>u.army===playerArmy&&u.type==="king"&&u.alive&&!u.deadAnimating);
  }
  if(king){
    camera.x=(king.moving?king.renderX:king.x)*TILE+TILE/2;
    camera.y=(king.moving?king.renderY:king.y)*TILE+TILE/2;
  }

  updatePieceButtons();updateUI();render();return true;
}
function saveProgress(){
  if(typeof playerArmy==="undefined"||!playerArmy)return;
  try{const data=saveSnapshot();localStorage.setItem(localSaveKey,JSON.stringify(data));}catch(e){console.warn("No se pudo guardar localmente",e);}
  if(cloudUser&&firebaseReady){if(saveBusy){saveQueued=true;return;}saveBusy=true;const data=saveSnapshot();window.caDb.collection("chessArenaSaves").doc(cloudUser.uid).set(data).catch(e=>{console.warn(e);googleStatus.textContent="Guardado local activo; error al sincronizar nube.";}).finally(()=>{saveBusy=false;if(saveQueued){saveQueued=false;saveProgress();}});}
}
async function loadCloudSave(){try{const snap=await window.caDb.collection("chessArenaSaves").doc(cloudUser.uid).get();if(snap.exists){restoreSnapshot(snap.data());localStorage.setItem(localSaveKey,JSON.stringify(snap.data()));}else{const local=localStorage.getItem(localSaveKey);if(local)restoreSnapshot(JSON.parse(local));}}catch(e){console.warn(e);googleStatus.textContent="No se pudo leer la nube; se conserva el guardado local.";}}
function signInGoogle(){if(!firebaseReady){googleStatus.textContent="Falta configurar Firebase. Consulta las instrucciones incluidas al final de este archivo; mientras tanto, el progreso se guarda en este navegador.";return;}const provider=new firebase.auth.GoogleAuthProvider();window.caAuth.signInWithPopup(provider).catch(e=>{console.warn(e);googleStatus.textContent="No se pudo iniciar sesión: "+(e.code||e.message);});}
document.getElementById("playButton").addEventListener("click",()=>{startScreen.style.display="none";showMessage("👑 ¡Tu reino te espera!");saveProgress();});
document.getElementById("googleButton").addEventListener("click",signInGoogle);
window.addEventListener("beforeunload",saveProgress);
setInterval(saveProgress,5000);
