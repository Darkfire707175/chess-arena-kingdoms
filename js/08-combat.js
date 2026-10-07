/* =========================================================
   INVOCAR PIEZAS
========================================================= */

function isUnlocked(type){
  if(type==="king")return true;
  if(type==="pawn")return true;
  return playerArmy.level>=UNLOCK[type];
}

function spawnPlayerPiece(type){

  if(gameEnded)return;

  /*
    EL REY NO SE PUEDE GENERAR.
    Solo existe el Rey inicial.
  */

  if(type==="king"){

    showMessage(
      "👑 Solo puede existir un Rey"
    );

    return;
  }

  if(!isUnlocked(type)){

    showMessage(
      `🔒 Se desbloquea en nivel ${UNLOCK[type]}`
    );

    return;
  }

  if(playerArmy.coins<COST[type]){

    showMessage(
      "🪙 No tienes suficientes monedas"
    );

    return;
  }

  const king=units.find(
    u=>
      u.alive&&
      u.army===playerArmy&&
      u.type==="king"
  );

  /*
    Si el Rey ha muerto pero aún no se ha acabado
    la partida, no se generan nuevas piezas.
  */

  if(!king){

    showMessage(
      "👑 Tu Rey ya no está en el campo"
    );

    return;
  }

  const options=[
    [1,0],[-1,0],[0,1],[0,-1],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];

  for(const [dx,dy] of options){

    const x=king.x+dx;
    const y=king.y+dy;

    if(validCell(x,y)){

      playerArmy.coins-=COST[type];

      createUnit(
        type,
        playerArmy,
        x,y
      );

      showMessage(
        `⚔️ ${capitalize(type)} desplegado`
      );

      updateUI();
      return;
    }
  }

  showMessage(
    "No hay espacio libre junto al Rey"
  );
}

function capitalize(s){
  return s.charAt(0).toUpperCase()+s.slice(1);
}

/* =========================================================
   BOTONES
========================================================= */

const pieceNames={
  king:"Rey",
  pawn:"Peón",
  bishop:"Alfil",
  knight:"Caballo",
  rook:"Torre",
  queen:"Reina"
};

function updatePieceButtons(){

  const box=document.getElementById("pieces");
  box.innerHTML="";

  for(const type of [
    "king",
    "pawn",
    "bishop",
    "knight",
    "rook",
    "queen"
  ]){

    const unlocked=isUnlocked(type);

    const b=document.createElement("button");

    b.className=
      "pieceBtn"+
      (!unlocked?" locked":"");

    if(type===spawnType){
      b.classList.add("selected");
    }

    const cost=
      type==="king"
      ?"Único"
      :`${COST[type]} 🪙`;

    b.innerHTML=`
      <div class="pieceIcon">
        ${PIECES[type].symbol}
      </div>
      <div class="pieceName">
        ${pieceNames[type]}
      </div>
      <div class="pieceCost">
        ${
          unlocked
          ?cost
          :`🔒 Nivel ${UNLOCK[type]}`
        }
      </div>
    `;

    b.onclick=()=>{

      if(type==="king"){

        showMessage(
          "👑 El Rey es único y no se puede generar"
        );

        return;
      }

      if(!unlocked){

        showMessage(
          `🔒 ${pieceNames[type]} se desbloquea en nivel ${UNLOCK[type]}`
        );

        return;
      }

      spawnType=type;
      spawnPlayerPiece(type);
      updatePieceButtons();
    };

    box.appendChild(b);
  }
}

/* =========================================================
   COMBATE
========================================================= */

function startAttackAnimation(attacker,defender){

  if(!attacker)return;

  const durations={
    king:680,
    pawn:590,
    bishop:760,
    knight:620,
    rook:780,
    queen:820
  };

  attacker.attackAnim={
    type:attacker.type,
    progress:0,
    duration:durations[attacker.type]||650,
    targetX:defender?.x??attacker.x,
    targetY:defender?.y??attacker.y,
    originX:attacker.attackOriginX??attacker.x,
    originY:attacker.attackOriginY??attacker.y,
    didKill:!!defender
  };
}


function capture(attacker,defender){

  if(
    !attacker||
    !defender||
    !attacker.alive||
    !defender.alive
  )return;

  /* Una pieza oculta en arbusto no puede ser atacada por un enemigo. */
  if(isUnitHiddenFromArmy(defender,attacker.army))return;

  /*
    EL REY MATA DE UN GOLPE.
    Para cualquier atacante normal también se resuelve
    aquí el combate según las reglas actuales.
  */

  startAttackAnimation(attacker,defender);

  /*
    La víctima permanece visible durante el impacto para que
    el golpe se pueda leer claramente antes de desaparecer.
  */
  defender.hitAnim={
    progress:0,
    duration:560,
    originX:defender.x,
    originY:defender.y,
    attackerType:attacker.type
  };

  defender.alive=false;
  defender.deadAnimating=true;

  const reward=
    KILL_REWARD[defender.type]||10;

  if(attacker.army===playerArmy){

    playerArmy.coins+=reward;
    playerArmy.score+=reward;
    playerArmy.xp+=ENEMY_XP;
    addAccountXP(ENEMY_XP);

    floatingTexts.push({
      x:defender.x,
      y:defender.y,
      text:`+${reward} 🪙`,
      life:1
    });

    checkPlayerLevel();

    if(defender.type==="king"){

      for(const u of units){

        if(
          u.alive&&
          u.army===defender.army
        ){
          u.alive=false;
          u.deadAnimating=true;
        }
      }

      playerArmy.score+=100;

      showMessage(
        `👑 ¡Has derrotado a ${defender.army.name}!`
      );
    }

  }else{

    attacker.army.coins+=reward;
    attacker.army.xp+=ENEMY_XP;

    if(defender.army===playerArmy){

      playerArmy.score=
        Math.max(0,playerArmy.score-0);
    }
  }

  /*
    Si el Rey del jugador recibe el ataque,
    pierde una vida.
  */

  if(
    defender.army===playerArmy&&
    defender.type==="king"
  ){

    playerArmy.lives--;

    if(playerArmy.lives<=0){
      endGame();
    }
  }

  if(selectedUnit===defender){
    selectedUnit=null;
  }

  /*
    No eliminamos inmediatamente el objeto del array.
    Se conserva para que la animación y las referencias
    existentes no provoquen errores.
  */

  setTimeout(()=>{

    defender.deadAnimating=false;

    if(defender.type==="king"){

      if(defender.army===playerArmy){
        endGame();
      }

    }

  },620);
}

/* =========================================================
   NIVEL
========================================================= */

function requiredForLevel(level){
  return level*150;
}

function checkPlayerLevel(){

  /*
    CORREGIDO:
    el coste de cada nivel se calcula dentro del while.
    Así puede subir varios niveles correctamente.
  */

  while(
    playerArmy.xp>=
    requiredForLevel(playerArmy.level)
  ){

    const need=
      requiredForLevel(playerArmy.level);

    playerArmy.xp-=need;
    playerArmy.level++;

    showMessage(
      `🎉 ¡Nivel ${playerArmy.level}!`
    );

    updatePieceButtons();
  }
}

/* =========================================================
   IA
========================================================= */

function enemyMove(army){

  const enemyUnits=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===army&&
    u.type!=="king"&&
    !u.moving
  );

  if(!enemyUnits.length)return;

  const playerUnits=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  if(!playerUnits.length)return;

  /*
    LA IA NO CONOCE LA POSICIÓN DEL JUGADOR POR DEFECTO.
    Solo puede perseguir una pieza si realmente la detecta
    con la visión de una de sus unidades o si esa pieza
    está temporalmente revelada por un cofre.
  */
  const detectedTargets=playerUnits.filter(u=>
    canArmySeeUnit(army,u)
  );

  /*
    Si no ha detectado ninguna pieza, sigue recorriendo
    el mapa de forma autónoma en lugar de ir hacia el Rey.
  */
  if(!detectedTargets.length){

    const roamingCandidates=[];

    for(const u of enemyUnits){

      if(u.cooldown>0)continue;

      const moves=getMoves(u);

      for(const move of moves){

        roamingCandidates.push({
          u,
          move,
          score:Math.random()
        });
      }
    }

    if(!roamingCandidates.length)return;

    roamingCandidates.sort((a,b)=>a.score-b.score);

    moveUnit(
      roamingCandidates[0].u,
      roamingCandidates[0].move
    );

    return;
  }

  /*
    Hay una pieza detectada.
    Se persigue la pieza visible/revelada más cercana.
  */
  let primaryTarget=detectedTargets[0];
  let bestDistance=Infinity;

  for(const target of detectedTargets){

    const d=Math.hypot(
      target.x-primaryTarget.x,
      target.y-primaryTarget.y
    );

    if(d<bestDistance){
      bestDistance=d;
      primaryTarget=target;
    }
  }

  /*
    Primero se intenta capturar directamente al objetivo
    detectado.
  */
  for(const u of enemyUnits){

    if(u.cooldown>0)continue;

    const moves=getMoves(u);

    const directCapture=moves.find(m=>
      m.capture&&
      m.x===primaryTarget.x&&
      m.y===primaryTarget.y
    );

    if(directCapture){
      moveUnit(u,directCapture);
      return;
    }
  }

  /*
    Si todavía no puede capturarlo, se acerca a su posición
    conocida. No recibe información mágica sobre las demás
    piezas del jugador.
  */
  const candidates=[];

  for(const u of enemyUnits){

    if(u.cooldown>0)continue;

    const moves=getMoves(u);

    for(const move of moves){

      const distance=
        Math.abs(move.x-primaryTarget.x)+
        Math.abs(move.y-primaryTarget.y);

      const captureBonus=move.capture?8:0;

      candidates.push({
        u,
        move,
        score:distance-captureBonus+Math.random()*1.5
      });
    }
  }

  if(!candidates.length)return;

  candidates.sort((a,b)=>a.score-b.score);

  moveUnit(
    candidates[0].u,
    candidates[0].move
  );
}
