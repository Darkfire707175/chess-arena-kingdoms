/* =========================================================
   MOVIMIENTO ANIMADO REAL
========================================================= */

function moveUnit(u,target){

  if(
    !u||
    !u.alive||
    u.deadAnimating||
    u.moving||
    u.cooldown>0||
    isUnitFrozen(u)
  )return;

  /*
    Comprobamos otra vez el movimiento justo antes
    de ejecutarlo. Esto evita que la IA o el jugador
    intenten ocupar una casilla que ya cambió.
  */

  const moves=getMoves(u);

  const legal=moves.some(
    m=>
      m.x===target.x&&
      m.y===target.y
  );

  if(!legal)return;

  const oldX=u.x;
  const oldY=u.y;

  const enemy=units.find(
    e=>
      e.alive&&
      !e.deadAnimating&&
      e.x===target.x&&
      e.y===target.y&&
      e.army!==u.army
  );

  /*
    Guardamos el destino lógico.
  */

  u.moveStartX=u.x;
  u.moveStartY=u.y;

  u.moveTargetX=target.x;
  u.moveTargetY=target.y;

  /*
    Guardamos desde qué dirección se realizó el ataque.
    La animación usa estos datos para orientar el corte,
    la carga o el proyectil.
  */
  u.attackOriginX=oldX;
  u.attackOriginY=oldY;

  u.moveProgress=0;

  /*
    La duración depende de la pieza.
    Los movimientos largos tardan más porque se desplazan
    casilla por casilla visualmente.
  */

  const distance=
    Math.hypot(
      target.x-u.x,
      target.y-u.y
    );

  const baseDuration=430;

  u.moveDuration=
    baseDuration*
    distance/
    Math.max(.45,PIECES[u.type].speed);

  u.moving=true;

  /*
    La casilla lógica se reserva inmediatamente.
    Así ninguna otra pieza puede aparecer encima durante
    la animación.
  */

  u.x=target.x;
  u.y=target.y;

  particles.push({
    x:oldX*TILE+TILE/2,
    y:oldY*TILE+TILE/2,
    life:.35,
    max:.35
  });

  /*
    Guardamos el enemigo para resolver el combate
    cuando la pieza llegue físicamente.
  */

  u.pendingEnemy=enemy||null;
}

/* =========================================================
   ANIMACIONES DE ATAQUE
========================================================= */

function updateAttackAnimation(u,dt){

  if(!u.attackAnim)return;

  u.attackAnim.progress+=
    (dt*1000)/u.attackAnim.duration;

  if(u.attackAnim.progress>=1){
    u.attackAnim.progress=1;
    u.attackAnim=null;
  }
}

function updateAttackAnimations(dt){

  for(const u of units){

    if(u.attackAnim){

      const duration=Number(u.attackAnim.duration);

      if(!Number.isFinite(duration)||duration<=0){
        u.attackAnim=null;
      }else{

        const current=Number(u.attackAnim.progress);

        u.attackAnim.progress=
          Number.isFinite(current)
          ?Math.min(
            1,
            Math.max(
              0,
              current+
              (dt*1000)/duration
            )
          )
          :0;

        if(u.attackAnim.progress>=1)
          u.attackAnim=null;
      }
    }

    if(u.hitAnim){

      u.hitAnim.progress=
        Math.min(
          1,
          u.hitAnim.progress+
          (dt*1000)/u.hitAnim.duration
        );

      if(u.hitAnim.progress>=1)
        u.hitAnim=null;
    }
  }
}

/* =========================================================
   ACTUALIZACIÓN
========================================================= */

function updateMovement(u,dt){

  if(!u.moving)return;

  u.moveProgress+=
    (dt*1000)/u.moveDuration;

  const t=clamp(
    u.moveProgress,
    0,
    1
  );

  /*
    Suavizado para que el movimiento no sea robótico.
  */

  const eased=
    t<.5
    ?4*t*t*t
    :1-Math.pow(-2*t+2,3)/2;

  u.renderX=
    u.moveStartX+
    (u.moveTargetX-u.moveStartX)*eased;

  u.renderY=
    u.moveStartY+
    (u.moveTargetY-u.moveStartY)*eased;

  if(t>=1){

    u.renderX=u.x;
    u.renderY=u.y;
    u.moving=false;

    u.cooldown=
      getUnitCooldown(u);

    const enemy=u.pendingEnemy;

    u.pendingEnemy=null;

    if(enemy&&enemy.alive){

      /*
        El enemigo debe seguir exactamente en la casilla
        de destino al finalizar el movimiento.
      */

      if(
        enemy.x===u.x&&
        enemy.y===u.y
      ){
        capture(u,enemy);
      }
    }

    /* Los cofres se recogen automáticamente al llegar. */
    if(u.army===playerArmy){
      collectChestAt(u.x,u.y,u);
    }
  }
}

function update(dt){

  if(gameEnded)return;

  /*
    Actualización de movimientos visuales.
  */

  for(const u of units){

    updateMovement(u,dt);

    if(u.cooldown>0){

      u.cooldown=
        Math.max(
          0,
          u.cooldown-dt
        );
    }
  }

  enemyTimer+=dt;
  recruitTimer+=dt;
  progressionTimer+=dt;

  if(enemyTimer>=.40){

    enemyTimer=0;

    for(const army of armies){

      if(Math.random()<.82){
        enemyMove(army);
      }
    }
  }

  if(progressionTimer>=8){

    progressionTimer=0;

    for(const army of armies){

      army.xp+=ENEMY_XP;
      army.coins+=15;

      while(
        army.xp>=
        requiredForLevel(army.level)
      ){

        army.xp-=
          requiredForLevel(army.level);

        army.level++;
      }
    }
  }

  if(recruitTimer>=3.2){

    recruitTimer=0;

    for(const army of armies){

      const count=units.filter(
        u=>
          u.alive&&
          !u.deadAnimating&&
          u.army===army
      ).length;

      if(count>=18)continue;

      let available=["pawn"];

      if(army.level>=2)
        available.push("bishop");

      if(army.level>=3)
        available.push("knight");

      if(army.level>=5)
        available.push("rook");

      if(army.level>=7)
        available.push("queen");

      const type=
        available[
          Math.floor(
            Math.random()*available.length
          )
        ];

      if(
        type!=="pawn"&&
        army.coins<COST[type]
      )continue;

      const spawn=enemySpawnNearPlayer();

      if(spawn){

        if(type!=="pawn"){
          army.coins-=COST[type];
        }

        createUnit(
          type,
          army,
          spawn.x,spawn.y
        );
      }
    }
  }

  for(let i=particles.length-1;i>=0;i--){

    particles[i].life-=dt;

    if(particles[i].life<=0)
      particles.splice(i,1);
  }

  for(let i=floatingTexts.length-1;i>=0;i--){

    floatingTexts[i].life-=dt;

    if(floatingTexts[i].life<=0)
      floatingTexts.splice(i,1);
  }
}

/* =========================================================
   NIEBLA DE GUERRA
   AHORA AFECTA A TODO EL MAPA
========================================================= */

function isVisible(x,y){

  const friendly=units.filter(
    u=>
      u.alive&&
      !u.deadAnimating&&
      u.army===playerArmy
  );

  for(const u of friendly){

    /*
      Durante el movimiento se utiliza también la posición
      gráfica para que la visión se desplace suavemente.
    */

    const ux=
      u.moving
      ?u.renderX
      :u.x;

    const uy=
      u.moving
      ?u.renderY
      :u.y;

    const d=Math.hypot(
      x-ux,
      y-uy
    );

    if(d<=PIECES[u.type].vision)
      return true;
  }

  return false;
}

/* =========================================================
   MAPA
========================================================= */

function drawMap(){

  const left=Math.max(
    0,
    Math.floor(
      (camera.x-W/(2*camera.zoom))/TILE
    )-2
  );

  const right=Math.min(
    MAP_W-1,
    Math.ceil(
      (camera.x+W/(2*camera.zoom))/TILE
    )+2
  );

  const top=Math.max(
    0,
    Math.floor(
      (camera.y-H/(2*camera.zoom))/TILE
    )-2
  );

  const bottom=Math.min(
    MAP_H-1,
    Math.ceil(
      (camera.y+H/(2*camera.zoom))/TILE
    )+2
  );

  for(let y=top;y<=bottom;y++){
    for(let x=left;x<=right;x++){
      drawTile(x,y);
    }
  }

  drawDesertTexture();
  drawDecorations();

  /* Cofres visibles solo dentro de la zona explorada. */
  for(const chest of chests){
    drawChest(chest);
  }

  /*
    Primero se muestran las casillas disponibles.
  */
  drawMoveCells();

  /*
    Unidades.
  */
  for(const u of units){
    drawUnit(u);
  }

  /*
    FOG GLOBAL.
    Ya no se excluye el cuadrante de ajedrez.
    Toda casilla del mapa puede estar bajo niebla.
  */

  ctx.save();

  for(let y=top;y<=bottom;y++){

    for(let x=left;x<=right;x++){

      if(isVisible(x,y))continue;

      const p=worldToScreen(
        x*TILE,
        y*TILE
      );

      const s=TILE*camera.zoom;

      ctx.fillStyle="rgba(5,7,10,.63)";

      ctx.fillRect(
        p.x,
        p.y,
        s+.5,
        s+.5
      );
    }
  }

  ctx.restore();

  /*
    Textos flotantes.
  */

  for(const f of floatingTexts){

    if(!isVisible(f.x,f.y))continue;

    const p=worldToScreen(
      f.x*TILE+TILE/2,
      f.y*TILE+TILE/2
    );

    ctx.globalAlpha=
      clamp(f.life,0,1);

    ctx.fillStyle="#f4d66c";

    ctx.font=
      `bold ${13*camera.zoom}px Arial`;

    ctx.textAlign="center";

    ctx.fillText(
      f.text,
      p.x,
      p.y-(1-f.life)*30
    );
  }

  ctx.globalAlpha=1;
}

/* =========================================================
   MINIMAPA
========================================================= */

function drawMinimap(){

  mini.clearRect(
    0,0,
    minimap.width,
    minimap.height
  );

  const sx=minimap.width/MAP_W;
  const sy=minimap.height/MAP_H;

  for(let y=0;y<MAP_H;y++){

    for(let x=0;x<MAP_W;x++){

      const t=terrain[y][x];

      if(t==="chessWhite"||t==="chessBlack"){
        mini.fillStyle=
          t==="chessWhite"
          ?"#aaa69a"
          :"#605b53";
      }
      else if(t==="grass")
        mini.fillStyle="#4d7546";
      else if(t==="dirt")
        mini.fillStyle="#8a6a4e";
      else if(t==="water")
        mini.fillStyle="#347e99";
      else if(t==="sand"||t==="sandDark")
        mini.fillStyle="#d8bd7b";
      else if(t==="lava")
        mini.fillStyle="#b82c16";
      else
        mini.fillStyle="#514747";

      mini.fillRect(
        x*sx,
        y*sy,
        sx+.5,
        sy+.5
      );
    }
  }

  /*
    En el minimapa también aplicamos la niebla.
    Solo se muestran las unidades enemigas si están
    dentro de la zona visible.
  */

  for(const u of units){

    if(!u.alive||u.deadAnimating)continue;

    const visible=
      u.army===playerArmy||
      isVisible(u.x,u.y);

    if(!visible)continue;

    mini.fillStyle=
      u.army===playerArmy
      ?"white"
      :u.army.color;

    mini.beginPath();

    mini.arc(
      (u.x+.5)*sx,
      (u.y+.5)*sy,
      u.type==="king"?3:1.7,
      0,Math.PI*2
    );

    mini.fill();
  }

  const cx=camera.x/TILE*sx;
  const cy=camera.y/TILE*sy;

  const vw=W/camera.zoom/TILE*sx;
  const vh=H/camera.zoom/TILE*sy;

  mini.strokeStyle="rgba(255,255,255,.7)";
  mini.lineWidth=2;

  mini.strokeRect(
    cx-vw/2,
    cy-vh/2,
    vw,
    vh
  );
}
