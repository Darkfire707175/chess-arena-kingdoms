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
