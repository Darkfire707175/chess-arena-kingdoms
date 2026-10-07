/* =========================================================
   UNIDADES
========================================================= */

function drawUnit(u){

  /*
    Una unidad derrotada se mantiene un instante si está
    reproduciendo la animación del impacto.
  */
  if(!u.alive&&!u.hitAnim)return;

  /*
    Los enemigos no se muestran si están dentro de la niebla
    ni si están ocultos dentro de un arbusto.
  */
  if(
    u.army!==playerArmy&&
    !canArmySeeUnit(playerArmy,u)&&
    !u.hitAnim
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

  let hitKickX=0;
  let hitKickY=0;
  let hitRotation=0;
  let hitScale=1;

  if(u.hitAnim){

    const ht=u.hitAnim;
    const hp=Math.sin(Math.PI*ht.progress);

    hitKickX=
      Math.sin(ht.progress*Math.PI*6)*
      s*.09*hp;

    hitKickY=
      -Math.abs(Math.sin(ht.progress*Math.PI*3))*
      s*.045*hp;

    hitRotation=
      Math.sin(ht.progress*Math.PI*8)*
      .10*hp;

    hitScale=
      1-.09*hp;
  }

  let attackLiftX=0;
  let attackLiftY=0;
  let attackRotation=0;

  if(u.attackAnim){

    const at=u.attackAnim;
    const t=at.progress;
    const phase=Math.sin(Math.PI*t);

    let dx=at.targetX-at.originX;
    let dy=at.targetY-at.originY;
    const len=Math.hypot(dx,dy)||1;

    dx/=len;
    dy/=len;

    if(at.type==="king"){
      attackLiftX=dx*s*.34*phase;
      attackLiftY=dy*s*.34*phase;
      attackRotation=dx*.14*phase;
    }else if(at.type==="pawn"){
      attackLiftX=dx*s*.42*phase;
      attackLiftY=dy*s*.42*phase;
      attackRotation=dx*.08*phase;
    }else if(at.type==="knight"){
      attackLiftX=dx*s*.52*phase;
      attackLiftY=dy*s*.52*phase;
      attackRotation=dx*.18*phase;
    }else if(at.type==="rook"){
      attackLiftX=dx*s*.18*phase;
      attackLiftY=dy*s*.18*phase;
      attackRotation=Math.sin(Math.PI*3*t)*.07;
    }else{
      attackLiftY=-s*.12*phase;
      attackRotation=Math.sin(Math.PI*2*t)*.06;
    }
  }

  ctx.translate(
    p.x+attackLiftX+hitKickX,
    p.y+idle+attackLiftY+hitKickY
  );
  ctx.rotate(attackRotation+hitRotation);
  ctx.scale(hitScale,hitScale);

  drawPieceAura(
    u.type,
    main,
    s,
    friendly
  );

  drawCharacterBackPiece(
    u.type,
    main,
    metal,
    dark,
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

  drawCharacterFrontPiece(
    u.type,
    main,
    metal,
    dark,
    s,
    friendly
  );

  if(u.attackAnim)
    drawAttackAnimation(
      u.attackAnim,
      s,
      main,
      friendly
    );

  if(u.hitAnim)
    drawHitReaction(
      u,
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
      Estado temporal de animación de ataque.
    */
    attackAnim:null,
    attackOriginX:x,
    attackOriginY:y,

    /*
      Marca temporal usada por la mecánica de cofres.
      No altera la vida ni el movimiento de la pieza.
    */
    revealedUntil:0
  };

  units.push(u);

  return u;
}

/* =========================================================
   SPAWN SEGURO
========================================================= */

const SAFE_PLAYER_DISTANCE=18;

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

function isSafeFromPlayer(x,y,minDistance=SAFE_PLAYER_DISTANCE){

  const targets=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  if(!targets.length)return true;

  for(const target of targets){

    const d=Math.hypot(
      x-target.x,
      y-target.y
    );

    if(d<minDistance)
      return false;
  }

  return true;
}

function randomSafeEnemyCell(){

  const targets=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  if(!targets.length)
    return randomValidCell();

  /*
    Primero intentamos encontrar una casilla completamente segura.
    No usamos un simple "randomValidCell" de reserva, porque eso
    podría volver a poner un enemigo cerca del Rey.
  */
  for(let i=0;i<12000;i++){

    const x=Math.floor(Math.random()*MAP_W);
    const y=Math.floor(Math.random()*MAP_H);

    if(!validCell(x,y))continue;

    const occupied=units.some(u=>
      u.alive&&
      !u.deadAnimating&&
      u.x===x&&
      u.y===y
    );

    if(occupied)continue;

    if(isSafeFromPlayer(x,y))
      return{x,y};
  }

  /*
    Segundo intento: elegimos la casilla válida que maximiza
    la distancia respecto a la pieza del jugador más cercana.
  */
  let best=null;
  let bestDistance=-Infinity;

  for(let i=0;i<2500;i++){

    const candidate=randomValidCell();

    const occupied=units.some(u=>
      u.alive&&
      !u.deadAnimating&&
      u.x===candidate.x&&
      u.y===candidate.y
    );

    if(occupied)continue;

    let nearest=Infinity;

    for(const target of targets){

      nearest=Math.min(
        nearest,
        Math.hypot(
          candidate.x-target.x,
          candidate.y-target.y
        )
      );
    }

    if(nearest>bestDistance){

      bestDistance=nearest;
      best=candidate;
    }
  }

  return best||randomValidCell();
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

  if(!targets.length)
    return randomSafeEnemyCell();

  /*
    Los enemigos/refuerzos aparecen preferiblemente a 28–33
    casillas del jugador y NUNCA dentro del radio de seguridad.
  */
  for(let attempt=0;attempt<120;attempt++){

    const target=
      targets[Math.floor(Math.random()*targets.length)];

    const angle=Math.random()*Math.PI*2;
    const distance=28+Math.random()*5;

    const x=Math.round(
      target.x+Math.cos(angle)*distance
    );

    const y=Math.round(
      target.y+Math.sin(angle)*distance
    );

    if(!validCell(x,y))continue;

    const occupied=units.some(u=>
      u.alive&&
      !u.deadAnimating&&
      u.x===x&&
      u.y===y
    );

    if(occupied)continue;

    if(!isSafeFromPlayer(x,y))continue;

    return{x,y};
  }

  return randomSafeEnemyCell();
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

/* =========================================================
   ANIMACIONES DE ATAQUE
========================================================= */

function drawAttackAnimation(at,s,main,friendly){

  const t=at.progress;
  const phase=Math.sin(Math.PI*t);
  const impactPhase=
    t<.48
    ?0
    :Math.sin(Math.PI*Math.min(1,(t-.48)/.52));

  const dxRaw=at.targetX-at.originX;
  const dyRaw=at.targetY-at.originY;
  const len=Math.hypot(dxRaw,dyRaw)||1;
  const dx=dxRaw/len;
  const dy=dyRaw/len;
  const px=-dy;
  const py=dx;

  const angle=Math.atan2(dy,dx);
  const accent=friendly?"#f7d75f":"#ff684f";
  const hot=friendly?"#fffbd6":"#ffe0bd";
  const white="#ffffff";

  ctx.save();
  ctx.globalCompositeOperation="lighter";

  /*
    Destello de preparación: la pieza "carga" el ataque.
  */
  if(t<.28){

    const charge=Math.sin(
      Math.PI*(t/.28)
    );

    ctx.globalAlpha=.15+.55*charge;

    ctx.fillStyle=hot;
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*(.35+.5*charge);

    ctx.beginPath();
    ctx.arc(
      0,-s*.28,
      s*(.10+.18*charge),
      0,Math.PI*2
    );
    ctx.fill();

    for(let i=0;i<6;i++){

      const a=angle+i*Math.PI/3;
      const r1=s*.18;
      const r2=s*(.35+.2*charge);

      ctx.strokeStyle=accent;
      ctx.lineWidth=Math.max(1.5,2.5*camera.zoom);

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(a)*r1,
        Math.sin(a)*r1
      );
      ctx.lineTo(
        Math.cos(a)*r2,
        Math.sin(a)*r2
      );
      ctx.stroke();
    }
  }

  /* REY — salto + corte gigante */
  if(at.type==="king"){

    const reach=s*(.65+1.05*phase);
    const slashR=s*(.55+.28*phase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.42;

    ctx.strokeStyle=white;
    ctx.lineWidth=Math.max(4,7*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.08,
      dy*s*.08,
      slashR,
      angle-1.65,
      angle+.55
    );
    ctx.stroke();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(3,10*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.08,
      dy*s*.08,
      slashR*.94,
      angle-1.6,
      angle+.48
    );
    ctx.stroke();

    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(2,4*camera.zoom);

    ctx.beginPath();
    ctx.moveTo(
      -px*s*.35,
      -py*s*.35
    );
    ctx.lineTo(
      dx*reach,
      dy*reach
    );
    ctx.stroke();
  }

  /* PEÓN — carga cometa + choque */
  if(at.type==="pawn"){

    const travel=s*(.5+1.15*phase);
    const burst=s*(.18+.42*impactPhase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.3;

    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(3,6*camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-dx*s*.3,-dy*s*.3);
    ctx.lineTo(dx*travel,dy*travel);
    ctx.stroke();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    for(let i=0;i<7;i++){

      const off=(i-3)*s*.08;

      ctx.beginPath();
      ctx.moveTo(
        -dx*s*(.35+i*.07)+px*off,
        -dy*s*(.35+i*.07)+py*off
      );
      ctx.lineTo(
        -dx*s*.08+px*off*.35,
        -dy*s*.08+py*off*.35
      );
      ctx.stroke();
    }

    if(t>.48){

      ctx.beginPath();
      ctx.arc(
        dx*s*.74,
        dy*s*.74,
        burst,
        0,Math.PI*2
      );
      ctx.stroke();

      ctx.fillStyle="rgba(255,240,175,.45)";
      ctx.beginPath();
      ctx.arc(
        dx*s*.74,
        dy*s*.74,
        burst*.48,
        0,Math.PI*2
      );
      ctx.fill();
    }
  }

  /* ALFIL — portal + tres rayos diagonales */
  if(at.type==="bishop"){

    const reach=s*(.65+1.45*phase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.5;

    for(let i=-2;i<=2;i++){

      ctx.strokeStyle=
        i===0
        ?white
        :(i%2===0?accent:"rgba(255,213,120,.8)");

      ctx.lineWidth=Math.max(
        1.8,
        (i===0?7:3)*camera.zoom
      );

      const offset=i*s*.11;

      ctx.beginPath();
      ctx.moveTo(
        -dx*reach*.6+px*offset,
        -dy*reach*.6+py*offset
      );
      ctx.lineTo(
        dx*reach+px*offset,
        dy*reach+py*offset
      );
      ctx.stroke();
    }

    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(3,5*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*reach,
      dy*reach,
      s*(.2+.3*impactPhase),
      0,Math.PI*2
    );
    ctx.stroke();
  }

  /* CABALLO — supercarga y estela */
  if(at.type==="knight"){

    const travel=s*(.7+1.15*phase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.38;

    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(4,7*camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-dx*s*.6,-dy*s*.6);
    ctx.lineTo(dx*travel,dy*travel);
    ctx.stroke();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    for(let i=0;i<10;i++){

      const off=(i-5)*s*.065;
      const tail=s*(.35+i*.08);

      ctx.beginPath();
      ctx.moveTo(
        -dx*tail+px*off,
        -dy*tail+py*off
      );
      ctx.lineTo(
        -dx*s*.05+px*off*.25,
        -dy*s*.05+py*off*.25
      );
      ctx.stroke();
    }

    if(t>.5){

      ctx.strokeStyle=white;
      ctx.lineWidth=Math.max(2,4*camera.zoom);

      ctx.beginPath();
      ctx.arc(
        dx*s*.7,
        dy*s*.7,
        s*(.15+.38*impactPhase),
        0,Math.PI*2
      );
      ctx.stroke();
    }
  }

  /* TORRE — martillazo + doble onda sísmica */
  if(at.type==="rook"){

    const r1=s*(.25+1.05*impactPhase);
    const r2=s*(.18+.72*impactPhase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.5;

    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(4,7*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.7,
      dy*s*.7,
      r1,
      0,Math.PI*2
    );
    ctx.stroke();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,4*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.7,
      dy*s*.7,
      r2,
      0,Math.PI*2
    );
    ctx.stroke();

    for(let i=0;i<12;i++){

      const a=i*Math.PI*2/12+t*.8;
      const inner=s*.12;
      const outer=s*(.55+.7*impactPhase);

      ctx.beginPath();
      ctx.moveTo(
        dx*s*.7+Math.cos(a)*inner,
        dy*s*.7+Math.sin(a)*inner
      );
      ctx.lineTo(
        dx*s*.7+Math.cos(a)*outer,
        dy*s*.7+Math.sin(a)*outer
      );
      ctx.stroke();
    }
  }

  /* REINA — rayo masivo + núcleo explosivo */
  if(at.type==="queen"){

    const reach=s*(.65+1.7*phase);
    const coreR=s*(.12+.26*impactPhase);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.65;

    for(let i=-3;i<=3;i++){

      const offset=i*s*.06;

      ctx.strokeStyle=
        i===0
        ?white
        :"rgba(244,191,87,.85)";

      ctx.lineWidth=Math.max(
        1.8,
        (i===0?9:3)*camera.zoom
      );

      const bend=
        Math.sin(
          t*Math.PI*6+i
        )*s*.11*(1-t*.4);

      ctx.beginPath();
      ctx.moveTo(
        dx*s*.05+px*offset,
        dy*s*.05+py*offset
      );
      ctx.lineTo(
        dx*reach*.48+px*offset+bend,
        dy*reach*.48+py*offset+bend
      );
      ctx.lineTo(
        dx*reach+px*offset,
        dy*reach+py*offset
      );
      ctx.stroke();
    }

    ctx.fillStyle=hot;
    ctx.beginPath();
    ctx.arc(
      dx*reach,
      dy*reach,
      coreR,
      0,Math.PI*2
    );
    ctx.fill();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(3,5*camera.zoom);
    ctx.beginPath();
    ctx.arc(
      dx*reach,
      dy*reach,
      coreR*1.8,
      0,Math.PI*2
    );
    ctx.stroke();

    if(t>.55){

      ctx.globalAlpha=.75*(1-t);

      ctx.strokeStyle=white;
      ctx.lineWidth=Math.max(1.5,3*camera.zoom);

      for(let i=0;i<8;i++){

        const a=i*Math.PI/4+t;
        const rr=s*(.3+.6*impactPhase);

        ctx.beginPath();
        ctx.moveTo(
          dx*reach+Math.cos(a)*s*.05,
          dy*reach+Math.sin(a)*s*.05
        );
        ctx.lineTo(
          dx*reach+Math.cos(a)*rr,
          dy*reach+Math.sin(a)*rr
        );
        ctx.stroke();
      }
    }
  }

  /* IMPACTO GIGANTE COMÚN */
  if(t>.46){

    const k=(t-.46)/.54;
    const fade=Math.max(0,1-k);
    const ix=dx*s*(.7+.25*impactPhase);
    const iy=dy*s*(.7+.25*impactPhase);

    ctx.globalAlpha=.95*fade;

    ctx.fillStyle=hot;
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.55;

    ctx.beginPath();
    ctx.arc(
      ix,
      iy,
      s*(.16+.45*k),
      0,Math.PI*2
    );
    ctx.fill();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,4*camera.zoom);

    for(let i=0;i<12;i++){

      const a=i*Math.PI*2/12;
      const inner=s*.12;
      const outer=s*(.5+.65*k);

      ctx.beginPath();
      ctx.moveTo(
        ix+Math.cos(a)*inner,
        iy+Math.sin(a)*inner
      );
      ctx.lineTo(
        ix+Math.cos(a)*outer,
        iy+Math.sin(a)*outer
      );
      ctx.stroke();
    }

    ctx.strokeStyle=white;
    ctx.lineWidth=Math.max(1.5,3*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      ix,
      iy,
      s*(.25+.55*k),
      0,Math.PI*2
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawHitReaction(u, s, friendly){

  if(!u.hitAnim)return;

  const t=u.hitAnim.progress;
  const fade=1-t;
  const accent=friendly?"#e8d06f":"#ef715a";

  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.globalAlpha=.9*fade;

  const shake=Math.sin(t*Math.PI*10)*s*.11*(1-t);
  const burst=s*(.16+.42*Math.min(1,t/.5));

  ctx.translate(shake,0);

  ctx.fillStyle="#fff8de";
  ctx.shadowColor=accent;
  ctx.shadowBlur=s*.28;

  ctx.beginPath();
  ctx.arc(0,0,burst*.32,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle=accent;
  ctx.lineWidth=Math.max(2,3*camera.zoom);

  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*burst*.2,Math.sin(a)*burst*.2);
    ctx.lineTo(Math.cos(a)*burst,Math.sin(a)*burst);
    ctx.stroke();
  }

  ctx.restore();
}

