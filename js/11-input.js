/* =========================================================
   RATÓN
========================================================= */

let dragging=false;
let cameraFree=false;
let dragStart={x:0,y:0};
let camStart={x:0,y:0};

canvas.addEventListener(
  "pointerdown",
  e=>{
    if(e.button===2){
      dragging=true;
      cameraFree=true;
      canvas.classList.add("dragging");
      dragStart.x=e.clientX;
      dragStart.y=e.clientY;
      camStart.x=camera.x;
      camStart.y=camera.y;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    if(e.button===0){
      dragStart.x=e.clientX;
      dragStart.y=e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }
  }
);

canvas.addEventListener(
  "pointermove",
  e=>{
    if(!dragging)return;

    const dx=e.clientX-dragStart.x;
    const dy=e.clientY-dragStart.y;

    camera.x=camStart.x-dx/camera.zoom;
    camera.y=camStart.y-dy/camera.zoom;

    clampCamera();
  }
);

canvas.addEventListener(
  "pointerup",
  e=>{
    const moved=Math.hypot(
      e.clientX-dragStart.x,
      e.clientY-dragStart.y
    );

    if(e.button===2){
      dragging=false;
      cameraFree=false;
      canvas.classList.remove("dragging");
      if(canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      return;
    }

    if(e.button===0){
      if(canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);

      if(moved<8){
        handleClick(e.clientX,e.clientY);
      }
    }
  }
);

canvas.addEventListener(
  "pointercancel",
  e=>{
    dragging=false;
    cameraFree=false;
    canvas.classList.remove("dragging");
  }
);

canvas.addEventListener(
  "contextmenu",
  e=>{
    e.preventDefault();
  }
);

canvas.addEventListener(
  "wheel",
  e=>{

    e.preventDefault();

    const before=
      screenToWorld(
        e.clientX,
        e.clientY
      );

    const factor=
      e.deltaY<0
      ?1.1
      :.9;

    camera.zoom=
      clamp(
        camera.zoom*factor,
        .35,
        2.2
      );

    const after=
      screenToWorld(
        e.clientX,
        e.clientY
      );

    camera.x+=before.x-after.x;
    camera.y+=before.y-after.y;

    clampCamera();
  },
  {passive:false}
);

function clampCamera(){

  const halfW=
    W/(2*camera.zoom);

  const halfH=
    H/(2*camera.zoom);

  camera.x=clamp(
    camera.x,
    halfW,
    MAP_W*TILE-halfW
  );

  camera.y=clamp(
    camera.y,
    halfH,
    MAP_H*TILE-halfH
  );
}

/* =========================================================
   CLICK
========================================================= */

function handleClick(sx,sy){

  if(gameEnded)return;

  const world=screenToWorld(sx,sy);
  const cell=tileAtWorld(world.x,world.y);

  if(!inBounds(cell.x,cell.y))return;

  /*
    MOVIMIENTO DIRECTO:
    ya no hace falta seleccionar una pieza. Al hacer clic en
    una casilla válida, buscamos automáticamente una pieza del
    jugador que pueda realizar exactamente ese movimiento.
  */
  const candidates=[];

  for(const u of units){
    if(
      !u.alive||
      u.deadAnimating||
      u.army!==playerArmy||
      u.moving||
      u.cooldown>0
    )continue;

    const move=getMoves(u).find(
      m=>m.x===cell.x&&m.y===cell.y
    );

    if(move){
      candidates.push({u,move});
    }
  }

  if(candidates.length){
    /* Si varias piezas pueden llegar, usamos la más cercana. */
    candidates.sort((a,b)=>{
      const da=Math.hypot(a.u.x-cell.x,a.u.y-cell.y);
      const db=Math.hypot(b.u.x-cell.x,b.u.y-cell.y);
      return da-db;
    });

    selectedUnit=candidates[0].u;
    moveUnit(candidates[0].u,candidates[0].move);
    selectedUnit=null;
    return;
  }

  /* Al hacer clic en una pieza ya no se selecciona: el movimiento
     siempre se inicia desde la casilla destino. */
  selectedUnit=null;
}

/* =========================================================
   TECLADO
========================================================= */

addEventListener(
  "keydown",
  e=>{

    keys[e.key.toLowerCase()]=true;

    if(e.key==="Escape"){
      selectedUnit=null;
    }

    /*
      SPACE YA NO GENERA REYES.
      Se mantiene como tecla de selección/despliegue
      del Peón, que es la pieza inicial alternativa.
    */

    if(e.code==="Space"){

      e.preventDefault();

      spawnType="pawn";
      spawnPlayerPiece("pawn");
      updatePieceButtons();
    }
  }
);

addEventListener(
  "keyup",
  e=>{
    keys[e.key.toLowerCase()]=false;
  }
);

function updateKeyboard(dt){

  const amount=
    520*dt/camera.zoom;

  if(keys["w"]||keys["arrowup"])
    camera.y-=amount;

  if(keys["s"]||keys["arrowdown"])
    camera.y+=amount;

  if(keys["a"]||keys["arrowleft"])
    camera.x-=amount;

  if(keys["d"]||keys["arrowright"])
    camera.x+=amount;

  clampCamera();
}
