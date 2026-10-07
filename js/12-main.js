/* =========================================================
   BUCLE PRINCIPAL
========================================================= */

function updateBrawlCamera(dt){
  /* Mientras el jugador mueve la cámara con botón derecho,
     el seguimiento automático queda temporalmente pausado. */
  if(cameraFree)return;

  const focus=selectedUnit&&selectedUnit.alive
    ?selectedUnit
    :units.find(u=>u.alive&&u.army===playerArmy&&u.type==="king");

  if(!focus)return;

  const fx=(focus.renderX!==undefined?focus.renderX:focus.x)*TILE+TILE/2;
  const fy=(focus.renderY!==undefined?focus.renderY:focus.y)*TILE+TILE/2;

  /* Seguimiento suave tipo Brawl Stars. */
  const follow=1-Math.pow(.001,Math.min(dt,.05));

  camera.x+=(fx-camera.x)*follow;
  camera.y+=(fy-camera.y)*follow;

  clampCamera();
}

function render(){

  ctx.clearRect(
    0,0,W,H
  );

  ctx.fillStyle="#101318";

  ctx.fillRect(
    0,0,W,H
  );

  drawMap();
  drawMinimap();
}

function loop(now){

  const dt=
    Math.min(
      .05,
      (now-lastTime)/1000
    );

  lastTime=now;

  updateKeyboard(dt);
  update(dt);
  updateBrawlCamera(dt);
  render();
  updateUI();

  requestAnimationFrame(loop);
}

/* =========================================================
   INICIO
========================================================= */

generateTerrain();
generateChests();
createPlayer();
createEnemyArmies();
try{const saved=localStorage.getItem(localSaveKey);if(saved)restoreSnapshot(JSON.parse(saved));}catch(e){console.warn("Guardado local no válido",e);}

updatePieceButtons();
updateUI();

showMessage(
  "👑 Rey y Peón desbloqueados desde el principio"
);

requestAnimationFrame(loop);
