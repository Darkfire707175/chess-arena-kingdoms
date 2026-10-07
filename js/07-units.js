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
      attackLiftX=dx*s*.16*phase;
      attackLiftY=dy*s*.16*phase;
      attackRotation=dx*.045*phase;
    }else if(at.type==="pawn"){
      attackLiftX=dx*s*.13*phase;
      attackLiftY=dy*s*.13*phase;
      attackRotation=dx*.035*phase;
    }else if(at.type==="knight"){
      attackLiftX=dx*s*.24*phase;
      attackLiftY=dy*s*.24*phase;
      attackRotation=dx*.08*phase;
    }else if(at.type==="rook"){
      /*
        La Torre sube y cae como una pieza pesada.
        El pico de la curva representa el salto antes
        del aplastamiento.
      */
      attackLiftY=-s*.30*phase;
      attackRotation=Math.sin(Math.PI*2*t)*.035;
    }else{
      attackLiftY=-s*.045*phase;
      attackRotation=Math.sin(Math.PI*t)*.025;
    }
  }

  ctx.translate(
    p.x+attackLiftX+hitKickX,
    p.y+idle+attackLiftY+hitKickY
  );
  ctx.rotate(attackRotation+hitRotation);
  ctx.scale(hitScale,hitScale);

  drawTowerMovementDust(u,s);

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

function drawTowerMovementDust(u,s){

  if(!u||u.type!=="rook"||!u.moving)return;

  const t=clamp(u.moveProgress,0,1);
  const dx=u.moveTargetX-u.moveStartX;
  const dy=u.moveTargetY-u.moveStartY;
  const len=Math.hypot(dx,dy)||1;
  const nx=-dx/len;
  const ny=-dy/len;

  ctx.save();
  ctx.globalAlpha=.36;
  ctx.globalCompositeOperation="source-over";

  for(let i=0;i<8;i++){

    const phase=
      (t*2.2+i*.31)%1;

    const side=
      (i%2===0?1:-1);

    const spread=
      s*(.08+phase*.28);

    const px=nx*spread+(-dy/len)*side*s*.10;
    const py=ny*spread+(dx/len)*side*s*.10;

    const radius=s*(.025+.045*(1-phase));

    ctx.fillStyle=
      i%3===0
      ?"rgba(214,193,153,.48)"
      :"rgba(174,154,122,.32)";

    ctx.beginPath();
    ctx.arc(
      px,
      py+s*.24,
      radius,
      0,
      Math.PI*2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawPhysicalSword(angle,length,width,accent,hot){

  ctx.save();
  ctx.rotate(angle);

  /* Empuñadura */
  ctx.strokeStyle="#17191d";
  ctx.lineWidth=Math.max(3,4*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(-swordGripLength(width),0);
  ctx.lineTo(0,0);
  ctx.stroke();

  ctx.strokeStyle="#7b5a2b";
  ctx.lineWidth=Math.max(2,2.6*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(-swordGripLength(width),0);
  ctx.lineTo(0,0);
  ctx.stroke();

  /* Guarda */
  ctx.strokeStyle=accent;
  ctx.lineWidth=Math.max(3,4*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(-width*1.8,-width*1.1);
  ctx.lineTo(width*1.8,width*1.1);
  ctx.stroke();

  /* Hoja */
  const blade=ctx.createLinearGradient(
    0,-width*2,
    length,width*2
  );

  blade.addColorStop(0,"#aab2b9");
  blade.addColorStop(.45,hot);
  blade.addColorStop(.72,"#d5dce0");
  blade.addColorStop(1,"#7f8a93");

  ctx.fillStyle=blade;
  ctx.strokeStyle="#1c2227";
  ctx.lineWidth=Math.max(1.5,2*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(0,-width*.75);
  ctx.lineTo(length-width*.15,-width*.30);
  ctx.lineTo(length+width*.08,0);
  ctx.lineTo(length-width*.15,width*.30);
  ctx.lineTo(0,width*.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  /* Filo luminoso */
  ctx.strokeStyle="rgba(255,255,255,.72)";
  ctx.lineWidth=Math.max(.9,1.4*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(width*.08,-width*.35);
  ctx.lineTo(length-width*.12,0);
  ctx.stroke();

  ctx.restore();
}

function swordGripLength(width){
  return Math.max(width*3.2,width*1.8);
}

function drawPhysicalSpear(angle,length,width,accent,hot){

  ctx.save();
  ctx.rotate(angle);

  /* Asta */
  ctx.strokeStyle="#3b2c1b";
  ctx.lineWidth=Math.max(3,4.2*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(-length*.45,0);
  ctx.lineTo(length,0);
  ctx.stroke();

  ctx.strokeStyle="#bc8b43";
  ctx.lineWidth=Math.max(1,1.5*camera.zoom);
  ctx.beginPath();
  ctx.moveTo(-length*.45,0);
  ctx.lineTo(length,0);
  ctx.stroke();

  /* Punta */
  ctx.fillStyle=hot;
  ctx.strokeStyle=accent;
  ctx.lineWidth=Math.max(1.2,1.8*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(length+.12*width,0);
  ctx.lineTo(length-width*2.2,-width*2.3);
  ctx.lineTo(length-width*1.1,0);
  ctx.lineTo(length-width*2.2,width*2.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawAttackAnimation(at,s,main,friendly){

  const t=at.progress;
  const pulse=Math.sin(Math.PI*t);
  const strong=Math.max(
    0,
    Math.sin(Math.PI*Math.min(1,t/.72))
  );

  const dxRaw=at.targetX-at.originX;
  const dyRaw=at.targetY-at.originY;
  const len=Math.hypot(dxRaw,dyRaw)||1;
  const dx=dxRaw/len;
  const dy=dyRaw/len;
  const px=-dy;
  const py=dx;

  const accent=friendly?"#f5d66f":"#e35e54";
  const hot=friendly?"#fff6bd":"#ffd0a1";

  ctx.save();
  ctx.globalCompositeOperation="lighter";

  /*
    REY — espada física y corte.
  */
  if(at.type==="king"){

    const swing=Math.min(
      1,
      Math.max(
        0,
        (t-.08)/.72
      )
    );

    const swordAngle=
      angle-1.35+swing*2.15;

    const swordLen=
      s*(.62+.16*Math.sin(Math.PI*swing));

    ctx.globalAlpha=
      t<.08
      ?0
      :Math.min(1,(t-.08)/.10);

    drawPhysicalSword(
      swordAngle,
      swordLen,
      s*.075,
      accent,
      hot
    );

    /*
      Estela secundaria muy fina: la espada física sigue
      siendo el elemento principal.
    */
    ctx.globalAlpha*=.45;
    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3*camera.zoom);
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      s*.48,
      swordAngle-.55,
      swordAngle+.25
    );
    ctx.stroke();
  }

  /*
    PEÓN — lanza física y estocada.
  */
  if(at.type==="pawn"){

    const thrust=
      Math.min(
        1,
        Math.max(
          0,
          (t-.10)/.56
        )
      );

    const spearLen=
      s*(.48+.72*thrust);

    ctx.globalAlpha=
      t<.08
      ?0
      :1;

    drawPhysicalSpear(
      angle,
      spearLen,
      s*.042,
      accent,
      hot
    );

    /* Pequeño impulso visual de la punta. */
    if(t>.48){

      const tip=spearLen;
      ctx.globalAlpha=Math.min(
        1,
        (t-.48)/.12
      );

      ctx.fillStyle=hot;
      ctx.shadowColor=accent;
      ctx.shadowBlur=s*.18;

      ctx.beginPath();
      ctx.arc(
        Math.cos(angle)*tip,
        Math.sin(angle)*tip,
        s*.065,
        0,
        Math.PI*2
      );
      ctx.fill();
      ctx.shadowBlur=0;
    }
  }

  /*
    ALFIL — tres cortes diagonales de energía.
  */
  if(at.type==="bishop"){

    const reach=s*(.35+1.05*strong);

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.28;

    for(let i=-1;i<=1;i++){

      ctx.strokeStyle=i===0?hot:accent;
      ctx.lineWidth=Math.max(
        2,
        (i===0?4.5:2.2)*camera.zoom
      );

      ctx.beginPath();
      ctx.moveTo(
        -dx*reach*.55+px*s*.13*i,
        -dy*reach*.55+py*s*.13*i
      );
      ctx.lineTo(
        dx*reach+px*s*.13*i,
        dy*reach+py*s*.13*i
      );
      ctx.stroke();
    }
  }

  /*
    CABALLO — carga de caballero con espada física.
  */
  if(at.type==="knight"){

    const charge=
      Math.min(
        1,
        Math.max(
          0,
          (t-.05)/.68
        )
      );

    const swordAngle=
      angle-.95+charge*1.65;

    const swordLen=
      s*(.58+.18*Math.sin(Math.PI*charge));

    ctx.globalAlpha=
      t<.05
      ?0
      :1;

    drawPhysicalSword(
      swordAngle,
      swordLen,
      s*.065,
      accent,
      hot
    );

    /* Estela de velocidad de la carga. */
    ctx.globalAlpha=.55;
    ctx.strokeStyle=hot;
    ctx.lineWidth=Math.max(2,3*camera.zoom);

    for(let i=0;i<4;i++){

      const tail=s*(.35+i*.10);

      ctx.beginPath();
      ctx.moveTo(
        -dx*tail+px*s*.06*i,
        -dy*tail+py*s*.06*i
      );
      ctx.lineTo(
        -dx*s*.10+px*s*.02*i,
        -dy*s*.10+py*s*.02*i
      );
      ctx.stroke();
    }
  }

  /*
    TORRE — caída pesada para aplastar.
  */
  if(at.type==="rook"){

    const impact=
      Math.min(
        1,
        Math.max(
          0,
          (t-.48)/.52
        )
      );

    /*
      Golpes de polvo durante la bajada.
    */
    ctx.globalAlpha=.85;

    for(let i=0;i<8;i++){

      const a=i*Math.PI/4+t*.7;
      const radius=s*(.16+impact*.58);
      const px2=Math.cos(a)*radius;
      const py2=Math.sin(a)*radius+s*.18;

      ctx.fillStyle=
        i%2
        ?"rgba(177,157,124,.38)"
        :"rgba(220,202,163,.52)";

      ctx.beginPath();
      ctx.arc(
        px2,
        py2,
        s*(.025+.045*impact),
        0,
        Math.PI*2
      );
      ctx.fill();
    }

    /*
      La onda expansiva aparece SOLO cuando realmente se
      ha producido una muerte.
    */
    if(at.didKill&&t>.58){

      const k=
        Math.min(
          1,
          Math.max(
            0,
            (t-.58)/.42
          )
        );

      const radius=
        s*(.12+1.05*k);

      ctx.globalAlpha=
        (1-k)*.9;

      ctx.strokeStyle=hot;
      ctx.shadowColor=accent;
      ctx.shadowBlur=s*.25;
      ctx.lineWidth=Math.max(
        3,
        5*camera.zoom
      );

      ctx.beginPath();
      ctx.arc(
        0,
        s*.20,
        radius,
        0,
        Math.PI*2
      );
      ctx.stroke();

      ctx.strokeStyle=accent;
      ctx.lineWidth=Math.max(
        2,
        3*camera.zoom
      );

      for(let i=0;i<10;i++){

        const a=i*Math.PI*2/10;
        const inner=s*.14;
        const outer=s*(.38+.65*k);

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(a)*inner,
          s*.20+Math.sin(a)*inner
        );
        ctx.lineTo(
          Math.cos(a)*outer,
          s*.20+Math.sin(a)*outer
        );
        ctx.stroke();
      }
    }
  }

  /*
    REINA — gran rayo + orbe de energía.
  */
  if(at.type==="queen"){

    const reach=s*(.4+1.45*strong);
    const width=s*(.035+.045*(1-t));

    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.35;

    for(let i=-2;i<=2;i++){

      ctx.strokeStyle=
        i===0
        ?hot
        :"rgba(240,185,85,.7)";

      ctx.lineWidth=Math.max(
        1.5,
        (i===0?6:2.2)*camera.zoom
      );

      const wobble=
        Math.sin(t*Math.PI*5+i)*s*.055*(1-t);

      ctx.beginPath();
      ctx.moveTo(
        dx*s*.06+px*i*width,
        dy*s*.06+py*i*width
      );
      ctx.lineTo(
        dx*reach+px*i*width+wobble,
        dy*reach+py*i*width+wobble
      );
      ctx.stroke();
    }

    ctx.fillStyle=hot;
    ctx.beginPath();
    ctx.arc(
      dx*reach,
      dy*reach,
      s*(.08+.16*strong),
      0,Math.PI*2
    );
    ctx.fill();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3*camera.zoom);
    ctx.beginPath();
    ctx.arc(
      dx*reach,
      dy*reach,
      s*(.16+.25*strong),
      0,Math.PI*2
    );
    ctx.stroke();
  }

  /*
    FLASH + estrella de impacto común.
  */
  if(t>.42){

    const k=Math.min(1,(t-.42)/.28);
    const fade=1-k;
    const ix=dx*s*(.45+.35*strong);
    const iy=dy*s*(.45+.35*strong);
    const radius=s*(.12+.32*k);

    ctx.globalAlpha=fade;

    ctx.fillStyle=hot;
    ctx.shadowColor=accent;
    ctx.shadowBlur=s*.3;

    ctx.beginPath();
    ctx.arc(ix,iy,radius,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle=accent;
    ctx.lineWidth=Math.max(2,3.5*camera.zoom);

    for(let i=0;i<8;i++){

      const a=i*Math.PI/4;
      const r1=s*.12;
      const r2=s*(.38+.3*k);

      ctx.beginPath();
      ctx.moveTo(
        ix+Math.cos(a)*r1,
        iy+Math.sin(a)*r1
      );
      ctx.lineTo(
        ix+Math.cos(a)*r2,
        iy+Math.sin(a)*r2
      );
      ctx.stroke();
    }
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

