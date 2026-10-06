/* =========================================================
   INVOCAR PIEZAS
========================================================= */

function isUnlocked(type){
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

  defender.alive=false;
  defender.deadAnimating=true;

  const reward=
    KILL_REWARD[defender.type]||10;

  if(attacker.army===playerArmy){

    playerArmy.coins+=reward;
    playerArmy.score+=reward;
    playerArmy.xp+=ENEMY_XP;

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

  },180);
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

  // El Rey enemigo nunca participa en ataques ni se usa para perseguir.
  if(!enemyUnits.length)return;

  const playerUnits=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  if(!playerUnits.length)return;

  // El objetivo principal es acercarse al Rey del jugador.
  const playerKing=playerUnits.find(u=>u.type==="king");
  const primaryTarget=playerKing||playerUnits[0];

  // 1. Primero: cualquier pieza que pueda capturar al Rey lo intenta.
  // Nunca lo hace el Rey enemigo porque está excluido arriba.
  for(const u of enemyUnits){

    if(u.cooldown>0)continue;

    const moves=getMoves(u);
    const captureKing=moves.find(m=>
      m.capture&&
      m.x===primaryTarget.x&&
      m.y===primaryTarget.y
    );

    if(captureKing){
      moveUnit(u,captureKing);
      return;
    }
  }

  // 2. Si no pueden capturarlo, buscan la mejor casilla para acercarse
  // al Rey. Así las distintas piezas participan en el ataque.
  const candidates=[];

  for(const u of enemyUnits){

    if(u.cooldown>0)continue;

    const moves=getMoves(u);

    for(const move of moves){

      const dKing=
        Math.abs(move.x-primaryTarget.x)+
        Math.abs(move.y-primaryTarget.y);

      // Las capturas de otras piezas también tienen prioridad.
      const captureBonus=move.capture?8:0;

      candidates.push({
        u,
        move,
        score:dKing-captureBonus+Math.random()*1.5
      });
    }
  }

  if(!candidates.length)return;

  candidates.sort((a,b)=>a.score-b.score);
  moveUnit(candidates[0].u,candidates[0].move);
}
