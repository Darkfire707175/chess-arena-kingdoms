/* =========================================================
   UI
========================================================= */

function updateUI(){

  document.getElementById("level")
    .textContent=playerArmy.level;

  document.getElementById("xp")
    .textContent=playerArmy.xp;

  document.getElementById("coins")
    .textContent=playerArmy.coins;

  document.getElementById("lives")
    .textContent=playerArmy.lives;

  document.getElementById("score")
    .textContent=playerArmy.score;

  const list=document.getElementById(
    "rankingList"
  );

  const all=[
    playerArmy,
    ...armies
  ].sort(
    (a,b)=>(b.score||0)-(a.score||0)
  );

  list.innerHTML="";

  for(const a of all){

    const div=document.createElement("div");
    div.className="rank";

    div.innerHTML=`
      <span style="color:${a.color}">
        ${a.name}
      </span>
      <b>${a.score||0}</b>
    `;

    list.appendChild(div);
  }
}

let messageTimer=null;

function showMessage(text){

  const el=document.getElementById("message");

  el.textContent=text;
  el.style.opacity="1";

  clearTimeout(messageTimer);

  messageTimer=setTimeout(()=>{
    el.style.opacity="0";
  },1800);
}

/* =========================================================
   TIENDA DE PIEZAS
========================================================= */

function spawnPlayerPiece(type){

  if(!PIECES[type]||type==="king")return;

  const requiredLevel=UNLOCK[type]||99;

  if(playerArmy.level<requiredLevel){
    showMessage("🔒 Desbloquea esta pieza en el nivel "+requiredLevel);
    return;
  }

  const cost=COST[type]||0;

  if(playerArmy.coins<cost){
    showMessage("🪙 No tienes suficientes monedas.");
    return;
  }

  const king=units.find(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy&&
    u.type==="king"
  );

  if(!king){
    showMessage("👑 No tienes Rey.");
    return;
  }

  const spots=[
    [1,0],[-1,0],[0,1],[0,-1],
    [2,0],[-2,0],[0,2],[0,-2],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];

  let spawn=null;

  for(const [dx,dy] of spots){
    const x=king.x+dx;
    const y=king.y+dy;

    if(
      inBounds(x,y)&&
      validCell(x,y)&&
      !units.some(u=>
        u.alive&&!u.deadAnimating&&
        u.x===x&&u.y===y
      )
    ){
      spawn={x,y};
      break;
    }
  }

  if(!spawn){
    showMessage("⚠️ No hay espacio junto al Rey.");
    return;
  }

  playerArmy.coins-=cost;

  createUnit(type,playerArmy,spawn.x,spawn.y);

  spawnType=type;
  updatePieceButtons();
  updateUI();
  saveProgress();

  showMessage("♟️ "+type.toUpperCase()+" generado.");
}

function updatePieceButtons(){

  const container=document.getElementById("pieces");
  if(!container)return;

  const pieces=[
    ["pawn","1","♟","PEÓN"],
    ["bishop","2","♝","ALFIL"],
    ["knight","3","♞","CABALLO"],
    ["rook","4","♜","TORRE"],
    ["queen","5","♛","REINA"]
  ];

  container.innerHTML="";

  for(const [type,key,icon,name] of pieces){

    const button=document.createElement("button");
    button.type="button";
    button.className="pieceBtn";

    const unlocked=playerArmy.level>=(UNLOCK[type]||99);
    const affordable=playerArmy.coins>=(COST[type]||0);

    if(!unlocked){
      button.classList.add("locked");
    }

    if(type===spawnType){
      button.classList.add("selected");
    }

    button.innerHTML=
      '<span class="pieceIcon">'+icon+'</span>'+
      '<span class="pieceName">'+key+" · "+name+'</span>'+
      '<span class="pieceCost">'+
        (unlocked?(COST[type]||0)+" 🪙":"NIVEL "+(UNLOCK[type]||99))+
      '</span>';

    button.title=
      unlocked
      ?"Generar "+name+" ("+key+")"
      :"Desbloquea en el nivel "+(UNLOCK[type]||99);

    button.addEventListener("click",()=>{
      spawnPlayerPiece(type);
    });

    if(!unlocked||!affordable){
      /*
        No bloqueamos el clic: así el jugador recibe el
        mensaje correspondiente de desbloqueo/monedas.
      */
    }

    container.appendChild(button);
  }
}

/* =========================================================
   FIN DE PARTIDA
========================================================= */

function endGame(){

  if(gameEnded)return;

  gameEnded=true;

  const overlay=
    document.getElementById("gameOver");

  overlay.style.display="flex";

  document.getElementById(
    "gameOverText"
  ).textContent=
    `Puntuación final: ${playerArmy.score}`;
}
