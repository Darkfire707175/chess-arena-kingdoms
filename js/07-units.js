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

    if(at.type==="king"||at.type==="pawn"||at.type==="knight"){
      attackLiftX=dx*s*.12*phase;
      attackLiftY=dy*s*.12*phase;
      attackRotation=at.type==="knight"
        ?dx*.10*phase
        :dx*.035*phase;
    }else if(at.type==="rook"){
      attackLiftX=Math.sin(Math.PI*2*t)*s*.035;
      attackRotation=Math.sin(Math.PI*4*t)*.035;
    }else{
      attackLiftY=-s*.045*phase;
      attackRotation=Math.sin(Math.PI*t)*.025;
    }
  }

  ctx.translate(
    p.x+attackLiftX,
    p.y+idle+attackLiftY
  );
  ctx.rotate(attackRotation);

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
  const easeOut=1-Math.pow(1-t,3);
  const alpha=
    t<.72
    ?Math.min(1,t/.18)
    :Math.max(0,1-(t-.72)/.28);

  const dxRaw=at.targetX-at.originX;
  const dyRaw=at.targetY-at.originY;
  const distance=Math.hypot(dxRaw,dyRaw)||1;
  const dx=dxRaw/distance;
  const dy=dyRaw/distance;

  const px=-dy;
  const py=dx;

  const accent=
    friendly
    ?"#f2d47a"
    :"#e07b58";

  ctx.save();
  ctx.globalAlpha=alpha;

  /* REY — gran corte de espada */
  if(at.type==="king"){

    ctx.strokeStyle="#fff8db";
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.15;
    ctx.lineWidth=Math.max(2,4*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.08,
      dy*s*.08,
      s*.48,
      Math.atan2(dy,dx)-1.25,
      Math.atan2(dy,dx)+.45
    );
    ctx.stroke();

    ctx.shadowBlur=0;
  }

  /* PEÓN — embestida con impacto */
  if(at.type==="pawn"){

    const push=Math.sin(Math.PI*t);

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.42,
      dy*s*.42,
      s*(.13+.18*push),
      0,Math.PI*2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dx*s*.18+px*s*.16,dy*s*.18+py*s*.16);
    ctx.lineTo(dx*s*.43+px*s*.16,dy*s*.43+py*s*.16);
    ctx.moveTo(dx*s*.18-px*s*.16,dy*s*.18-py*s*.16);
    ctx.lineTo(dx*s*.43-px*s*.16,dy*s*.43-py*s*.16);
    ctx.stroke();
  }

  /* ALFIL — descarga diagonal */
  if(at.type==="bishop"){

    ctx.strokeStyle="#f6e4a3";
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.18;
    ctx.lineWidth=Math.max(2,3.5*camera.zoom);

    const travel=s*(.18+easeOut*.62);

    ctx.beginPath();
    ctx.moveTo(-dx*travel,-dy*travel);
    ctx.lineTo(dx*travel,dy*travel);
    ctx.stroke();

    ctx.shadowBlur=0;

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(1,1.7*camera.zoom);

    ctx.beginPath();
    ctx.moveTo(
      dx*travel+px*s*.16,
      dy*travel+py*s*.16
    );
    ctx.lineTo(
      dx*travel-px*s*.16,
      dy*travel-py*s*.16
    );
    ctx.stroke();
  }

  /* CABALLO — doble estela de carga */
  if(at.type==="knight"){

    ctx.strokeStyle=accent;
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.14;
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    const end=s*(.3+easeOut*.42);

    for(const side of [-1,1]){

      ctx.beginPath();
      ctx.moveTo(
        -dx*s*.18+px*s*.12*side,
        -dy*s*.18+py*s*.12*side
      );
      ctx.quadraticCurveTo(
        dx*s*.04+px*s*.2*side,
        dy*s*.04+py*s*.2*side,
        dx*end+px*s*.13*side,
        dy*end+py*s*.13*side
      );
      ctx.stroke();
    }

    ctx.shadowBlur=0;
  }

  /* TORRE — golpe y onda de choque */
  if(at.type==="rook"){

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3.5*camera.zoom);

    const r=s*(.15+easeOut*.58);

    ctx.beginPath();
    ctx.arc(
      0,s*.22,
      r,
      0,Math.PI*2
    );
    ctx.stroke();

    ctx.globalAlpha*=.55;

    for(let i=0;i<4;i++){

      const a=i*Math.PI/2+t*.8;
      const len=s*(.25+easeOut*.32);

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(a)*s*.08,
        s*.22+Math.sin(a)*s*.08
      );
      ctx.lineTo(
        Math.cos(a)*len,
        s*.22+Math.sin(a)*len
      );
      ctx.stroke();
    }
  }

  /* REINA — rayo de energía */
  if(at.type==="queen"){

    ctx.strokeStyle="#fff4bf";
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.2;

    const start=-s*.08;
    const end=s*(.28+easeOut*.58);

    ctx.lineWidth=Math.max(
      2,
      (2.5+2.5*(1-t))*camera.zoom
    );

    ctx.beginPath();
    ctx.moveTo(dx*start,dy*start);

    const wiggle=s*.045*(1-t);

    ctx.quadraticCurveTo(
      dx*end*.5+px*wiggle,
      dy*end*.5+py*wiggle,
      dx*end,
      dy*end
    );

    ctx.stroke();

    ctx.fillStyle=accent;
    ctx.beginPath();
    ctx.arc(
      dx*end,
      dy*end,
      s*(.045+.08*easeOut),
      0,Math.PI*2
    );
    ctx.fill();

    ctx.shadowBlur=0;
  }

  /* DESTELLO final de impacto común */
  if(t>.55){

    const impact=Math.min(1,(t-.55)/.18);

    ctx.globalAlpha=
      (1-impact)*.8;

    ctx.fillStyle="#fffdf0";

    ctx.beginPath();
    ctx.arc(
      dx*s*.38,
      dy*s*.38,
      s*(.12+.16*impact),
      0,Math.PI*2
    );
    ctx.fill();

    ctx.globalAlpha=
      (1-impact)*.65;

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(1,2*camera.zoom);

    ctx.beginPath();
    ctx.arc(
      dx*s*.38,
      dy*s*.38,
      s*(.2+.22*impact),
      0,Math.PI*2
    );
    ctx.stroke();
  }

  ctx.restore();
}
