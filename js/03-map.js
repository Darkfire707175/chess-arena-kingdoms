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
  level:1,
  lives:3,
  score:0
};

let camera={
  x:MAP_W*TILE/2,
  y:MAP_H*TILE/2,
  zoom:.85
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

const keys={};

const enemyColors=[
  "#b5323e","#3273b9","#329a68","#864bb1",
  "#c79627","#4059a8","#23a4a5","#c86b29"
];

const enemyNames=[
  "Rey Carmesí","Reino Azul","Esmeralda","Violeta",
  "Dorado","Índigo","Turquesa","Ámbar"
];
