/* =========================================================
   UNIDADES
========================================================= */

function drawUnit(u){

  if(!u.alive)return;

  /*
    Los enemigos no se muestran si están dentro de la niebla
    ni si están ocultos dentro de un arbusto.
  */
  if(
    u.army!==playerArmy&&
    !canArmySeeUnit(playerArmy,u)
  )return;

  /*
    CORRECCIÓN IMPORTANTE:
    La unidad se dibuja usando renderX/renderY.
    Así el movimiento deja de ser teletransporte.
  */

  const rx=
    u.renderX!==undefined
    ?u.renderX
    :u.x;

  const ry=
    u.renderY!==undefined
    ?u.renderY
    :u.y;

  const p=worldToScreen(
    rx*TILE+TILE/2,
    ry*TILE+TILE/2
  );

  const s=TILE*.86*camera.zoom;

  /*
    Animación de reposo muy sutil para dar vida a las unidades
    sin alterar su posición lógica en el tablero.
  */
  const idleSeed=
    String(u.id||"").split("").reduce(
      (n,c)=>n+c.charCodeAt(0),
      0
    );

  const idle=
    !u.moving
    ?Math.sin(performance.now()/650+idleSeed)*s*.018
    :0;


  if(
    p.x+s<0||p.y+s<0||
    p.x-s>W||p.y-s>H
  )return;

  const friendly=u.army===playerArmy;

  const main=friendly
    ?"#dfe4e8"
    :u.army.color;

  const dark=friendly
    ?"#3d464f"
    :"#30191e";

  const metal=friendly
    ?"#9faab3"
    :"#74252d";

  ctx.save();
  ctx.translate(p.x,p.y+idle);

  drawPieceAura(
    u.type,
    main,
    s,
    friendly
  );

  ctx.fillStyle="rgba(0,0,0,.35)";

  ctx.beginPath();
  ctx.ellipse(
    0,s*.38,s*.34,s*.12,
    0,0,Math.PI*2
  );
  ctx.fill();

  if(selectedUnit===u){

    ctx.strokeStyle="#e8cf6c";
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    ctx.beginPath();
    ctx.arc(0,0,s*.52,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="rgba(232,207,108,.07)";

    ctx.beginPath();
    ctx.arc(0,0,s*.55,0,Math.PI*2);
    ctx.fill();
  }

  if(u.type==="king")
    drawKingPiece(main,metal,dark,s);
  else if(u.type==="pawn")
    drawPawnPiece(main,metal,dark,s);
  else if(u.type==="bishop")
    drawBishopPiece(main,metal,dark,s);
  else if(u.type==="knight")
    drawKnightPiece(main,metal,dark,s);
  else if(u.type==="rook")
    drawRookPiece(main,metal,dark,s);
  else if(u.type==="queen")
    drawQueenPiece(main,metal,dark,s);

  drawPieceFinishing(
    u.type,
    main,
    metal,
    dark,
    s,
    friendly
  );

  ctx.restore();
}

/* =========================================================
   MOVIMIENTO
========================================================= */

function validCell(x,y,ignore=null){

  if(!inBounds(x,y))return false;

  const t=terrain[y][x];

  /*
    Obstáculos reales:
    agua y roca no se pueden atravesar.
    La lava sigue siendo transitable.
  */

  if(
    t==="water"||
    t==="stone"||
    t==="volcanicRock"
  ){
    return false;
  }

  return !occupied(x,y,ignore);
}

function isBushCell(x,y){

  if(!inBounds(x,y))return false;

  return terrainDecor[y].some(
    d=>d.type==="bush"&&d.x===x&&d.y===y
  );
}

/*
  Las unidades dentro de un arbusto quedan ocultas para
  los ejércitos enemigos. Su propio ejército siempre puede verlas.
*/
function isUnitHiddenFromArmy(unit,viewerArmy){

  if(!unit||!unit.alive)return false;
  if(unit.army===viewerArmy)return false;

  /*
    Una pieza que acaba de recoger un cofre queda revelada
    temporalmente incluso si está dentro de un arbusto.
  */
  if(
    viewerArmy!==playerArmy&&
    Number(unit.revealedUntil||0)>Date.now()
  )return false;

  return isBushCell(unit.x,unit.y);
}

function canArmySeeUnit(viewerArmy,unit){

  if(!unit||!unit.alive||unit.deadAnimating)return false;
  if(unit.army===viewerArmy)return true;

  /*
    Revelación temporal por cofre: todos los enemigos
    conocen la ubicación actual de esta pieza.
  */
  if(
    viewerArmy!==playerArmy&&
    Number(unit.revealedUntil||0)>Date.now()
  )return true;

  if(isUnitHiddenFromArmy(unit,viewerArmy))return false;

  if(viewerArmy===playerArmy){
    return isVisible(unit.x,unit.y);
  }

  const viewers=units.filter(
    u=>u.alive&&!u.deadAnimating&&u.army===viewerArmy
  );

  for(const viewer of viewers){
    const vx=viewer.moving?viewer.renderX:viewer.x;
    const vy=viewer.moving?viewer.renderY:viewer.y;
    if(Math.hypot(unit.x-vx,unit.y-vy)<=PIECES[viewer.type].vision)
      return true;
  }

  return false;
}

function clearRay(x,y,dx,dy,range,viewerArmy=null){

  const cells=[];

  for(let i=1;i<=range;i++){

    const nx=x+dx*i;
    const ny=y+dy*i;

    if(!inBounds(nx,ny))break;

    const enemy=units.find(
      u=>
        u.alive&&
        !u.deadAnimating&&
        u.x===nx&&
        u.y===ny
    );

    if(enemy){

      if(
        enemy.army!==viewerArmy &&
        !isUnitHiddenFromArmy(enemy,viewerArmy)
      ){
        cells.push({
          x:nx,
          y:ny,
          capture:true
        });
      }

      break;
    }

    if(validCell(nx,ny)){
      cells.push({
        x:nx,
        y:ny,
        capture:false
      });
    }else{
      break;
    }
  }

  return cells;
}

function getMoves(u){

  if(!u||!u.alive||u.moving)return[];

  const moves=[];

  const add=(x,y)=>{

    if(!inBounds(x,y))return;

    const enemy=units.find(
      e=>
        e.alive&&
        !e.deadAnimating&&
        e.x===x&&
        e.y===y
    );

    if(enemy){

      if(
        enemy.army!==u.army&&
        !isUnitHiddenFromArmy(enemy,u.army)
      ){
        moves.push({
          x,y,capture:true
        });
      }

      return;
    }

    if(validCell(x,y,u)){
      moves.push({
        x,y,capture:false
      });
    }
  };

  if(u.type==="king"){

    for(let dx=-1;dx<=1;dx++){
      for(let dy=-1;dy<=1;dy++){
        if(dx||dy)add(u.x+dx,u.y+dy);
      }
    }

  }else if(u.type==="pawn"){

    add(u.x+1,u.y);
    add(u.x-1,u.y);
    add(u.x,u.y+1);
    add(u.x,u.y-1);

    for(const [dx,dy] of [
      [1,1],[1,-1],[-1,1],[-1,-1]
    ]){

      const enemy=units.find(
        e=>
          e.alive&&
          !e.deadAnimating&&
          e.x===u.x+dx&&
          e.y===u.y+dy&&
          e.army!==u.army
      );

      if(
        enemy&&
        !isUnitHiddenFromArmy(enemy,u.army)
      ){
        moves.push({
          x:u.x+dx,
          y:u.y+dy,
          capture:true
        });
      }
    }

  }else if(u.type==="knight"){

    const jumps=[
      [1,2],[2,1],[-1,2],[-2,1],
      [1,-2],[2,-1],[-1,-2],[-2,-1]
    ];

    for(const [dx,dy] of jumps)
      add(u.x+dx,u.y+dy);

  }else if(u.type==="bishop"){

    for(const [dx,dy] of [
      [1,1],[1,-1],[-1,1],[-1,-1]
    ]){
      moves.push(
        ...clearRay(
          u.x,u.y,dx,dy,
          PIECES.bishop.range,
          u.army
        )
      );
    }

  }else if(u.type==="rook"){

    for(const [dx,dy] of [
      [1,0],[-1,0],[0,1],[0,-1]
    ]){
      moves.push(
        ...clearRay(
          u.x,u.y,dx,dy,
          PIECES.rook.range,
          u.army
        )
      );
    }

  }else if(u.type==="queen"){

    for(const [dx,dy] of [
      [1,0],[-1,0],[0,1],[0,-1],
      [1,1],[1,-1],[-1,1],[-1,-1]
    ]){
      moves.push(
        ...clearRay(
          u.x,u.y,dx,dy,
          PIECES.queen.range,
          u.army
        )
      );
    }
  }

  return moves;
}

/* =========================================================
   MOVIMIENTOS VISIBLES
========================================================= */

/*
  Ahora se muestran los movimientos de TODAS las piezas
  aliadas, no únicamente de la seleccionada.
*/

function drawMoveCells(){

  const friendlyUnits=units.filter(
    u=>
      u.alive&&
      u.army===playerArmy&&
      !u.moving
  );

  for(const u of friendlyUnits){

    const moves=getMoves(u);

    for(const m of moves){

      const p=worldToScreen(
        m.x*TILE,
        m.y*TILE
      );

      const s=TILE*camera.zoom;

      /*
        La selección mantiene un resaltado más fuerte.
      */

      const selected=(u===selectedUnit);

      ctx.fillStyle=
        m.capture
        ?"rgba(220,60,55,.38)"
        :"rgba(230,208,92,.18)";

      ctx.fillRect(
        p.x,p.y,s,s
      );

      ctx.strokeStyle=
        m.capture
        ?"rgba(255,105,90,.75)"
        :"rgba(255,231,115,.48)";

      ctx.lineWidth=Math.max(
        1,
        (selected?1.7:1.1)*camera.zoom
      );

      ctx.strokeRect(
        p.x,p.y,s,s
      );
    }
  }
}

/* =========================================================
   CREACIÓN DE UNIDADES
========================================================= */

function createUnit(type,army,x,y){

  const u={
    id:Math.random().toString(36).slice(2),
    type,
    army,
    x,
    y,

    /*
      Posición gráfica independiente de la lógica.
    */
    renderX:x,
    renderY:y,

    alive:true,
    moving:false,
    deadAnimating:false,
    moveStartX:x,
    moveStartY:y,
    moveTargetX:x,
    moveTargetY:y,
    moveProgress:0,
    moveDuration:0,
    cooldown:0,
    /*
      Marca temporal usada por la mecánica de cofres.
      No altera la vida ni el movimiento de la pieza.
    */
    revealedUntil:0
  };

  units.push(u);

  return u;
}

function randomValidCell(){

  for(let i=0;i<5000;i++){

    const x=Math.floor(
      Math.random()*MAP_W
    );

    const y=Math.floor(
      Math.random()*MAP_H
    );

    if(validCell(x,y))
      return{x,y};
  }

  return{x:2,y:2};
}

/* =========================================================
   EJÉRCITOS
========================================================= */

function createPlayer(){

  const p=randomValidCell();

  createUnit(
    "king",
    playerArmy,
    p.x,p.y
  );

  /*
    SOLO UN REY.
    El Peón está desbloqueado pero no aparece
    automáticamente.
  */

  camera.x=p.x*TILE+TILE/2;
  camera.y=p.y*TILE+TILE/2;
}

function enemySpawnNearPlayer(){

  const targets=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  if(!targets.length)return randomValidCell();

  // Los refuerzos aparecen normalmente a unas 30 casillas
  // de alguna pieza del jugador, pero sin aparecer encima.
  for(let attempt=0;attempt<80;attempt++){

    const target=targets[Math.floor(Math.random()*targets.length)];
    const angle=Math.random()*Math.PI*2;
    const distance=28+Math.random()*5;

    const x=Math.round(target.x+Math.cos(angle)*distance);
    const y=Math.round(target.y+Math.sin(angle)*distance);

    if(!validCell(x,y))continue;

    const occupied=units.some(u=>
      u.alive&&!u.deadAnimating&&u.x===x&&u.y===y
    );

    if(occupied)continue;

    return{x,y};
  }

  // Si el mapa no permite un punto exacto, buscamos una casilla
  // válida que quede lo más cerca posible de las 30 casillas.
  let best=null;
  let bestDiff=Infinity;

  for(let i=0;i<180;i++){
    const pos=randomValidCell();
    const target=targets[Math.floor(Math.random()*targets.length)];
    const d=Math.hypot(pos.x-target.x,pos.y-target.y);
    const diff=Math.abs(d-30);

    if(diff<bestDiff){
      bestDiff=diff;
      best=pos;
    }
  }

  return best||randomValidCell();
}

function createEnemyArmies(){

  armies=[];

  for(let i=0;i<8;i++){

    const army={
      id:"enemy"+i,
      name:enemyNames[i],
      color:enemyColors[i],
      coins:100,
      xp:0,
      level:1,
      score:0
    };

    armies.push(army);

    const p=enemySpawnNearPlayer();

    createUnit(
      "king",
      army,
      p.x,p.y
    );

    const n=enemySpawnNearPlayer();

    createUnit(
      "pawn",
      army,
      n.x,n.y
    );
  }
}
