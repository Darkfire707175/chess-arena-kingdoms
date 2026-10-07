/* =========================================================
   BUCLE PRINCIPAL
========================================================= */

function updateBrawlCamera(dt){
  /*
    La cámara es completamente libre.
    NO sigue automáticamente al Rey ni a ninguna pieza.
    Para volver al Rey se debe pulsar ESPACIO.
  */
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
