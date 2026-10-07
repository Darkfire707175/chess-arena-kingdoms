/* =========================================================
   CONFIGURACIÓN
========================================================= */

const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

const minimap=document.getElementById("minimap");
const mini=minimap.getContext("2d");

let W=innerWidth;
let H=innerHeight;

function resize(){
  W=canvas.width=innerWidth;
  H=canvas.height=innerHeight;
}
addEventListener("resize",resize);
resize();

const TILE=52;
const MAP_W=104;
const MAP_H=80;
const MID_X=MAP_W/2;
const MID_Y=MAP_H/2;

const PIECES={
  king:{speed:1,cooldown:1,vision:5,range:1,symbol:"♚"},
  pawn:{speed:.9,cooldown:.9,vision:4,range:1,symbol:"♟"},
  bishop:{speed:1.1,cooldown:1.2,vision:6,range:8,symbol:"♝"},
  knight:{speed:1.3,cooldown:1.3,vision:4,range:1,symbol:"♞"},
  rook:{speed:1,cooldown:1.3,vision:7,range:8,symbol:"♜"},
  queen:{speed:1.2,cooldown:1.15,vision:6,range:8,symbol:"♛"}
};

const COST={
  pawn:30,
  bishop:60,
  knight:60,
  rook:100,
  queen:150
};

/* REY Y PEÓN DESDE EL PRINCIPIO */
const UNLOCK={
  king:1,
  pawn:1,
  bishop:2,
  knight:3,
  rook:5,
  queen:7
};

const KILL_REWARD={
  pawn:10,
  bishop:20,
  knight:20,
  rook:30,
  queen:50,
  king:100
};

const ENEMY_XP=33;

/* =========================================================
   PROGRESIÓN DE CUENTA
   El nivel de cuenta es permanente entre partidas.
========================================================= */
const ACCOUNT_XP_BASE=150;

let accountLevel=1;
let accountXp=0;

function accountXpRequired(level=accountLevel){
  return Math.max(
    ACCOUNT_XP_BASE,
    Math.round(level*ACCOUNT_XP_BASE)
  );
}

function getStartingGameLevel(){
  /*
    Cada nueva partida comienza con el 25% del nivel de cuenta.
    Se mantiene como mínimo nivel 1 para que las piezas básicas
    sigan disponibles al empezar.
  */
  return Math.max(
    1,
    accountLevel*.25
  );
}

function addAccountXP(amount){
  const gain=Math.max(0,Number(amount)||0);
  if(!gain)return;

  accountXp+=gain;

  while(accountXp>=accountXpRequired(accountLevel)){
    accountXp-=accountXpRequired(accountLevel);
    accountLevel++;
  }

  if(typeof updateAccountProgressUI==="function"){
    updateAccountProgressUI();
  }
}

/* =========================================================
   ESTADO
========================================================= */

let terrain=[];
let terrainDecor=[];
let armies=[];
let units=[];

let playerArmy={
  id:"player",
  name:"Tu Reino",
  color:"#dce2e7",
  coins:100,
  xp:0,
  level:getStartingGameLevel(),
  lives:3,
  score:0
};

let camera={
  x:MAP_W*TILE/2,
  y:MAP_H*TILE/2,
  zoom:1.08
};

let selectedUnit=null;
let spawnType="pawn";

let gameEnded=false;

let particles=[];
let floatingTexts=[];

/* Cofres: aparecen en el mapa y se recogen al entrar en su casilla. */
let chests=[];

let lastTime=performance.now();
let enemyTimer=0;
let recruitTimer=0;
let progressionTimer=0;
let volcanicKills=0;

const keys={};

const enemyColors=[
  "#b5323e","#3273b9","#329a68","#864bb1",
  "#c79627","#4059a8","#23a4a5","#c86b29"
];

const enemyNames=[
  "Rey Carmesí","Reino Azul","Esmeralda","Violeta",
  "Dorado","Índigo","Turquesa","Ámbar"
];
