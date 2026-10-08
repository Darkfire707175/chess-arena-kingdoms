
/* =========================================================
   CHESS ARENA — SISTEMAS DE PARTIDA
   Arbustos, despliegue manual, objetos, pase y misiones.
   No modifica las texturas ni las piezas.
========================================================= */

"use strict";

const ARENA_ITEM_DEFS={
  bombSmall:{icon:"💣",name:"Bomba pequeña",price:2,description:"Explosión pequeña que daña a los enemigos cercanos."},
  bombBig:{icon:"💣",name:"Bomba grande",price:4,description:"Explosión mayor que afecta a una zona más amplia."},
  mine:{icon:"🧨",name:"Mina",price:3,description:"Queda oculta y explota cuando entra un enemigo."},
  electricTrap:{icon:"⚡",name:"Trampa eléctrica",price:3,description:"Inmoviliza al primer enemigo que la activa."},
  iceBomb:{icon:"🧊",name:"Bomba de hielo",price:4,description:"Congela a los enemigos cercanos durante 2 segundos."},
  smoke:{icon:"🌫️",name:"Bomba de humo",price:2,description:"Crea una zona que bloquea la visión durante unos segundos."},
  wall:{icon:"🧱",name:"Muro portátil",price:3,description:"Crea una barrera temporal que bloquea el paso."},
  bushSeed:{icon:"🌿",name:"Semilla de arbusto",price:2,description:"Crea un arbusto dentro de tu zona iluminada."},
  visionTotem:{icon:"👁️",name:"Tótem de visión",price:4,description:"Amplía la luz alrededor de su posición temporalmente."},
  portal:{icon:"🌀",name:"Portal",price:5,description:"Conecta dos posiciones visibles para teletransportar tus piezas."},
  fireZone:{icon:"🔥",name:"Zona de fuego",price:4,description:"Daña periódicamente a los enemigos dentro del área."},
  impulse:{icon:"💨",name:"Impulso",price:3,description:"Reduce inmediatamente el cooldown de una pieza."}
};

const ARENA_PASS_XP_PER_LEVEL=500;
const ARENA_PASS_MAX_LEVEL=30;

const ARENA_MISSIONS={
  daily:[
    {id:"dailyKills",text:"Derrota 15 enemigos",goal:15,reward:250,unit:"kills"},
    {id:"dailyChests",text:"Recoge 2 cofres",goal:2,reward:220,unit:"chests"},
    {id:"dailyBushes",text:"Crea 3 arbustos",goal:3,reward:200,unit:"bushes"}
  ],
  weekly:[
    {id:"weeklyKills",text:"Derrota 60 enemigos",goal:60,reward:600,unit:"kills"},
    {id:"weeklyItems",text:"Usa 5 objetos",goal:5,reward:550,unit:"items"},
    {id:"weeklyExplore",text:"Descubre 200 casillas",goal:200,reward:500,unit:"explore"}
  ]
};

const ARENA_SEASON="TEMPORADA 1";

let arenaInventory={};
let arenaLoadout=[];
let arenaPlacementMode=null;
let arenaPortalFirst=null;

let arenaShrubs=[];
let arenaWalls=[];
let arenaMines=[];
let arenaElectricTraps=[];
let arenaIceBombs=[];
let arenaSmokes=[];
let arenaVisionTotems=[];
let arenaPortals=[];
let arenaFireZones=[];
let arenaEffects=[];

let arenaPassXp=0;
let arenaPassLevel=1;
let arenaClaimedPassLevels=[];
let arenaMissionState={
  dayKey:"",
  weekKey:"",
  daily:{},
  weekly:{}
};

let arenaExploredCells=new Set();
let arenaTickTimer=0;
let arenaExploreTimer=0;
let arenaShopTab="items";
let arenaSelectedItem=null;
let arenaStyleReady=false;

function arenaDayKey(){
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function arenaWeekKey(){
  const d=new Date();
  const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1);
  return d.getFullYear()+"-W"+String(Math.ceil(
    (((d-new Date(d.getFullYear(),0,1))/86400000)+new Date(d.getFullYear(),0,1).getDay()+1)/7
  )).padStart(2,"0");
}

function arenaEnsureMissionState(){

  const dayKey=arenaDayKey();
  const weekKey=arenaWeekKey();

  if(arenaMissionState.dayKey!==dayKey){
    arenaMissionState.dayKey=dayKey;
    arenaMissionState.daily={};
  }

  if(arenaMissionState.weekKey!==weekKey){
    arenaMissionState.weekKey=weekKey;
    arenaMissionState.weekly={};
  }

  for(const mission of ARENA_MISSIONS.daily){
    if(!Number.isFinite(Number(arenaMissionState.daily[mission.id])))
      arenaMissionState.daily[mission.id]=0;
  }

  for(const mission of ARENA_MISSIONS.weekly){
    if(!Number.isFinite(Number(arenaMissionState.weekly[mission.id])))
      arenaMissionState.weekly[mission.id]=0;
  }
}

function arenaStateSnapshot(){
  arenaEnsureMissionState();

  return {
    inventory:{...arenaInventory},
    loadout:[...arenaLoadout],
    passXp:Math.max(0,Number(arenaPassXp)||0),
    passLevel:Math.max(1,Number(arenaPassLevel)||1),
    claimedPassLevels:[...arenaClaimedPassLevels],
    missions:{
      dayKey:arenaMissionState.dayKey,
      weekKey:arenaMissionState.weekKey,
      daily:{...arenaMissionState.daily},
      weekly:{...arenaMissionState.weekly}
    }
  };
}

function restoreArenaSystemState(data){

  const d=data&&data.arenaSystems;
  if(!d)return;

  arenaInventory={};
  if(d.inventory&&typeof d.inventory==="object"){
    for(const id of Object.keys(ARENA_ITEM_DEFS)){
      const n=Math.max(0,Math.floor(Number(d.inventory[id])||0));
      if(n>0)arenaInventory[id]=n;
    }
  }

  arenaLoadout=Array.isArray(d.loadout)
    ?[...new Set(d.loadout.filter(id=>ARENA_ITEM_DEFS[id]))].slice(0,3)
    :[];

  arenaPassXp=Math.max(0,Number(d.passXp)||0);
  arenaPassLevel=Math.max(1,Math.min(
    ARENA_PASS_MAX_LEVEL,
    Math.floor(Number(d.passLevel)||1)
  ));

  arenaClaimedPassLevels=Array.isArray(d.claimedPassLevels)
    ?[...new Set(
      d.claimedPassLevels
        .map(n=>Math.floor(Number(n)||0))
        .filter(n=>n>=1&&n<=ARENA_PASS_MAX_LEVEL)
    )]
    :[];

  arenaMissionState={
    dayKey:d.missions?.dayKey||"",
    weekKey:d.missions?.weekKey||"",
    daily:{...(d.missions?.daily||{})},
    weekly:{...(d.missions?.weekly||{})}
  };

  arenaEnsureMissionState();
}

function arenaRewardPassLevel(level){

  if(arenaClaimedPassLevels.includes(level))return;

  let rewardText="";

  if(level%10===0){
    const diamonds=50+(level/10-1)*50;
    globalDiamonds=Math.max(0,Number(globalDiamonds)||0)+diamonds;
    rewardText=`+${diamonds} 💎`;
  }else if(level%5===0){
    const coins=500+level*50;
    playerArmy.coins+=coins;
    rewardText=`+${coins} 🪙`;
  }else{
    const id=
      level%3===0?"bombSmall":
      level%3===1?"bushSeed":
      "smoke";

    arenaInventory[id]=(arenaInventory[id]||0)+1;
    rewardText=`+${ARENA_ITEM_DEFS[id].icon} ${ARENA_ITEM_DEFS[id].name}`;
  }

  arenaClaimedPassLevels.push(level);
  if(rewardText)
    showMessage("🎟️ Pase de batalla nivel "+level+" · "+rewardText);
}

function addArenaPassXP(amount){

  const gain=Math.max(0,Number(amount)||0);
  if(!gain)return;

  arenaPassXp+=gain;

  while(
    arenaPassLevel<ARENA_PASS_MAX_LEVEL &&
    arenaPassXp>=ARENA_PASS_XP_PER_LEVEL
  ){
    arenaPassXp-=ARENA_PASS_XP_PER_LEVEL;
    arenaPassLevel++;
    arenaRewardPassLevel(arenaPassLevel);
  }

  if(arenaPassLevel>=ARENA_PASS_MAX_LEVEL){
    arenaPassXp=Math.min(
      arenaPassXp,
      ARENA_PASS_XP_PER_LEVEL-1
    );
  }

  renderArenaSystemsUI();
  saveProgress();
}

function arenaMissionProgress(type,amount=1){

  arenaEnsureMissionState();

  const gain=Math.max(0,Number(amount)||0);
  if(!gain)return;

  for(const mission of ARENA_MISSIONS.daily){
    if(mission.unit!==type)continue;
    const before=Math.min(
      mission.goal,
      Math.max(0,Number(arenaMissionState.daily[mission.id])||0)
    );
    const after=Math.min(mission.goal,before+gain);
    arenaMissionState.daily[mission.id]=after;

    if(before<mission.goal&&after>=mission.goal){
      addArenaPassXP(mission.reward);
      showMessage("✅ Misión diaria completada: "+mission.text);
    }
  }

  for(const mission of ARENA_MISSIONS.weekly){
    if(mission.unit!==type)continue;
    const before=Math.min(
      mission.goal,
      Math.max(0,Number(arenaMissionState.weekly[mission.id])||0)
    );
    const after=Math.min(mission.goal,before+gain);
    arenaMissionState.weekly[mission.id]=after;

    if(before<mission.goal&&after>=mission.goal){
      addArenaPassXP(mission.reward);
      showMessage("✅ Misión semanal completada: "+mission.text);
    }
  }

  renderArenaSystemsUI();
  saveProgress();
}

function arenaRegisterKill(){
  addArenaPassXP(25);
  arenaMissionProgress("kills",1);
}

function arenaRegisterChest(){
  addArenaPassXP(20);
  arenaMissionProgress("chests",1);
}

function arenaRegisterItemUse(){
  addArenaPassXP(15);
  arenaMissionProgress("items",1);
}

function arenaRegisterBush(){
  arenaMissionProgress("bushes",1);
}

function arenaUpdateExploration(){

  const playerUnits=units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy
  );

  for(const u of playerUnits){

    const ux=Math.round(u.moving?u.renderX:u.x);
    const uy=Math.round(u.moving?u.renderY:u.y);
    const radius=Math.ceil(getUnitVision(u)+1);

    for(let y=uy-radius;y<=uy+radius;y++){
      for(let x=ux-radius;x<=ux+radius;x++){
        if(!inBounds(x,y))continue;

        const d=Math.hypot(x-ux,y-uy);
        if(d<=getUnitVision(u))
          arenaExploredCells.add(y*MAP_W+x);
      }
    }
  }

  if(arenaExploredCells.size){
    const previous=Math.max(
      0,
      Number(arenaMissionState.weekly.weeklyExplore)||0
    );
    const current=Math.min(
      200,
      Math.max(previous,Math.min(200,arenaExploredCells.size))
    );

    if(current>previous){
      arenaMissionState.weekly.weeklyExplore=current;
      renderArenaSystemsUI();
      saveProgress();
    }
  }
}

/* =========================================================
   COLOCACIÓN MANUAL DE PIEZAS Y ARBUSTOS
========================================================= */

function arenaCanPlaceCell(x,y){

  if(!inBounds(x,y))return false;
  if(!isVisible(x,y))return false;
  if(!validCell(x,y))return false;

  if(
    units.some(u=>
      u.alive&&
      !u.deadAnimating&&
      u.x===x&&
      u.y===y
    )
  )return false;

  return true;
}

function arenaStartPiecePlacement(type){

  if(gameEnded)return;

  if(!PIECES[type]||type==="king"){
    if(type==="king")
      showMessage("👑 Solo existe un Rey.");
    return;
  }

  if(playerArmy.level<(UNLOCK[type]||99)){
    showMessage("🔒 Desbloquea esta pieza en el nivel "+UNLOCK[type]);
    return;
  }

  if(playerArmy.coins<(COST[type]||0)){
    showMessage("🪙 No tienes suficientes monedas.");
    return;
  }

  if(
    typeof arenaPlacementMode==="object"&&
    arenaPlacementMode.kind==="piece"&&
    arenaPlacementMode.type===type
  ){
    arenaPlacementMode=null;
    spawnType=type;
    updatePieceButtons();
    showMessage("❌ Colocación cancelada.");
    return;
  }

  arenaPlacementMode={
    kind:"piece",
    type
  };

  arenaPortalFirst=null;
  spawnType=type;
  updatePieceButtons();
  showMessage("🎯 Coloca el "+type.toUpperCase()+" en una casilla iluminada. ESC cancela.");
}

function arenaPlacePieceAt(x,y){

  const mode=arenaPlacementMode;
  if(!mode||mode.kind!=="piece")return false;

  if(!arenaCanPlaceCell(x,y)){
    showMessage("🚫 Solo puedes desplegar en una casilla visible y libre.");
    return true;
  }

  const type=mode.type;
  const cost=COST[type]||0;

  if(playerArmy.coins<cost){
    arenaPlacementMode=null;
    showMessage("🪙 Ya no tienes suficientes monedas.");
    return true;
  }

  playerArmy.coins-=cost;
  createUnit(type,playerArmy,x,y);

  arenaPlacementMode=null;
  arenaExploredCells.add(y*MAP_W+x);

  updatePieceButtons();
  updateUI();
  saveProgress();

  showMessage("⚔️ "+type.toUpperCase()+" desplegado en la posición elegida.");
  return true;
}

function arenaPlaceBushAt(x,y){

  if(!arenaCanPlaceCell(x,y)){
    showMessage("🚫 El arbusto solo puede colocarse en una casilla iluminada y libre.");
    return true;
  }

  if(arenaShrubs.length>=8){
    showMessage("🌿 Ya tienes el máximo de 8 arbustos.");
    return true;
  }

  arenaShrubs.push({
    x,y,
    until:0
  });

  arenaRegisterBush();

  arenaPlacementMode=null;
  showMessage("🌿 ¡Arbusto creado!");
  renderArenaSystemsUI();
  saveProgress();
  return true;
}

function arenaStartBushPlacement(){

  if(gameEnded)return;

  const king=units.find(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army===playerArmy&&
    u.type==="king"
  );

  if(!king){
    showMessage("👑 Necesitas tener al Rey en el campo.");
    return;
  }

  if(
    arenaPlacementMode&&
    arenaPlacementMode.kind==="bush"
  ){
    arenaPlacementMode=null;
    showMessage("❌ Colocación de arbusto cancelada.");
    return;
  }

  arenaPlacementMode={kind:"bush"};
  arenaPortalFirst=null;

  showMessage("🌿 Elige una casilla iluminada para crear el arbusto.");
}

/* Sustituimos el despliegue automático por colocación manual. */
const arenaOriginalSpawnPlayerPiece=window.spawnPlayerPiece;

window.spawnPlayerPiece=function(type){
  return arenaStartPiecePlacement(type);
};

function arenaCreateBushButton(){

  if(document.getElementById("arenaBushButton"))return;

  const button=document.createElement("button");
  button.id="arenaBushButton";
  button.type="button";
  button.textContent="🌿 ARBUSTO";
  button.title="Crear un arbusto dentro de tu zona de luz";
  button.addEventListener("click",arenaStartBushPlacement);

  document.body.appendChild(button);
}

/* =========================================================
   OBJETOS Y USO EN PARTIDA
========================================================= */

function arenaCount(id){
  return Math.max(0,Math.floor(Number(arenaInventory[id])||0));
}

function arenaIsEquipped(id){
  return arenaLoadout.includes(id);
}

function arenaEquipItem(id){

  if(!ARENA_ITEM_DEFS[id]||!arenaCount(id))return;

  if(arenaIsEquipped(id)){
    arenaLoadout=arenaLoadout.filter(x=>x!==id);
    renderArenaSystemsUI();
    saveProgress();
    return;
  }

  if(arenaLoadout.length>=3){
    showMessage("🎒 Ya tienes 3 objetos equipados.");
    return;
  }

  arenaLoadout.push(id);
  renderArenaSystemsUI();
  saveProgress();
}

function arenaPurchaseItem(id){

  const def=ARENA_ITEM_DEFS[id];
  if(!def)return;

  if(globalDiamonds<def.price){
    showMessage("💎 No tienes suficientes diamantes.");
    return;
  }

  globalDiamonds-=def.price;
  arenaInventory[id]=(arenaInventory[id]||0)+1;

  if(arenaLoadout.length<3&&!arenaIsEquipped(id)){
    arenaLoadout.push(id);
  }

  showMessage(def.icon+" "+def.name+" comprado por "+def.price+" 💎");
  renderArenaSystemsUI();
  updateUI();
  saveProgress();
}

function arenaSelectItem(id){

  if(!arenaCount(id)){
    showMessage("No tienes ninguna carga de este objeto.");
    return;
  }

  if(!arenaIsEquipped(id)){
    showMessage("🎒 Equipa el objeto antes de usarlo.");
    return;
  }

  arenaSelectedItem=
    arenaSelectedItem===id
    ?null
    :id;

  renderArenaSystemsUI();
}

function arenaConsumeItem(id){

  const count=arenaCount(id);
  if(!count)return false;

  arenaInventory[id]=count-1;
  if(arenaInventory[id]<=0)delete arenaInventory[id];

  arenaSelectedItem=null;
  arenaRegisterItemUse();
  renderArenaSystemsUI();
  updateUI();
  saveProgress();
  return true;
}

function arenaEffect(x,y,type,radius=1){

  arenaEffects.push({
    x,y,type,radius,
    life:.55,
    maxLife:.55
  });
}

function arenaLivingEnemiesInRadius(x,y,radius){

  return units.filter(u=>
    u.alive&&
    !u.deadAnimating&&
    u.army!==playerArmy&&
    Math.max(
      Math.abs(u.x-x),
      Math.abs(u.y-y)
    )<=radius
  );
}

function arenaEliminateEnemy(unit,sourceLabel="objeto"){

  if(!unit||!unit.alive||unit.deadAnimating)return;

  if(unit.type==="king"){

    unit.hitAnim={
      progress:0,
      duration:440,
      originX:unit.x,
      originY:unit.y,
      attackerType:"king"
    };
    unit.alive=false;
    unit.deadAnimating=true;

    for(const ally of units){
      if(ally!==unit&&ally.alive&&ally.army===unit.army){
        ally.alive=false;
        ally.deadAnimating=true;
      }
    }

    const reward=KILL_REWARD.king||100;
    playerArmy.coins+=reward;
    playerArmy.score+=reward;
    playerArmy.xp+=ENEMY_XP;
    addAccountXP(ENEMY_XP);
    checkPlayerLevel();
    arenaRegisterKill();

    setTimeout(()=>{
      unit.deadAnimating=false;
    },520);

    showMessage("👑 ¡Has derrotado a "+unit.army.name+"!");

    return;
  }

  unit.hitAnim={
    progress:0,
    duration:400,
    originX:unit.x,
    originY:unit.y,
    attackerType:"king"
  };
  unit.alive=false;
  unit.deadAnimating=true;

  const reward=KILL_REWARD[unit.type]||10;
  playerArmy.coins+=reward;
  playerArmy.score+=reward;
  playerArmy.xp+=ENEMY_XP;
  addAccountXP(ENEMY_XP);
  checkPlayerLevel();
  arenaRegisterKill();

  floatingTexts.push({
    x:unit.x,
    y:unit.y,
    text:"+"+reward+" 🪙",
    life:1
  });

  setTimeout(()=>{
    unit.deadAnimating=false;
  },460);
}

function arenaDetonateBomb(x,y,radius,type){

  arenaEffect(
    x,
    y,
    type==="bombBig"?"bombBig":"bombSmall",
    radius
  );

  for(const enemy of arenaLivingEnemiesInRadius(x,y,radius)){
    arenaEliminateEnemy(enemy,"bomba");
  }
}

function arenaFreezeEnemies(x,y,radius,duration){

  const enemies=arenaLivingEnemiesInRadius(x,y,radius);

  for(const enemy of enemies){
    enemy.frozenUntil=Math.max(
      Number(enemy.frozenUntil)||0,
      Date.now()+duration
    );

    if(enemy.moving){
      enemy.moving=false;
      enemy.moveProgress=1;
      enemy.renderX=enemy.x;
      enemy.renderY=enemy.y;
      enemy.moveStartX=enemy.x;
      enemy.moveStartY=enemy.y;
      enemy.moveTargetX=enemy.x;
      enemy.moveTargetY=enemy.y;
      enemy.pendingEnemy=null;
    }
  }

  if(enemies.length)
    showMessage("❄️ "+enemies.length+" enemigo(s) congelado(s) durante 2 segundos.");
}

function arenaPlaceObject(id,x,y){

  if(!arenaCanPlaceCell(x,y)){
    showMessage("🚫 Solo puedes colocar objetos en una casilla iluminada y libre.");
    return true;
  }

  switch(id){

    case "bombSmall":
      arenaConsumeItem(id);
      setTimeout(()=>arenaDetonateBomb(x,y,1,"bombSmall"),650);
      showMessage("💣 Bomba colocada.");
      return true;

    case "bombBig":
      arenaConsumeItem(id);
      setTimeout(()=>arenaDetonateBomb(x,y,2,"bombBig"),750);
      showMessage("💣 Bomba grande colocada.");
      return true;

    case "mine":
      arenaConsumeItem(id);
      arenaMines.push({x,y});
      showMessage("🧨 Mina colocada y oculta.");
      return true;

    case "electricTrap":
      arenaConsumeItem(id);
      arenaElectricTraps.push({x,y});
      showMessage("⚡ Trampa eléctrica preparada.");
      return true;

    case "iceBomb":
      arenaConsumeItem(id);
      arenaFreezeEnemies(x,y,1,2000);
      arenaEffect(x,y,"iceBomb",1);
      return true;

    case "smoke":
      arenaConsumeItem(id);
      arenaSmokes.push({
        x,y,
        radius:2,
        until:Date.now()+5000
      });
      arenaEffect(x,y,"smoke",2);
      showMessage("🌫️ Humo desplegado.");
      return true;

    case "wall":
      arenaConsumeItem(id);
      arenaWalls.push({
        x,y,
        until:Date.now()+12000
      });
      arenaEffect(x,y,"wall",.7);
      showMessage("🧱 Muro creado.");
      return true;

    case "bushSeed":
      if(arenaShrubs.length>=8){
        showMessage("🌿 Ya tienes el máximo de 8 arbustos.");
        return true;
      }
      arenaConsumeItem(id);
      arenaShrubs.push({x,y,until:0});
      arenaRegisterBush();
      showMessage("🌿 Arbusto plantado.");
      return true;

    case "visionTotem":
      arenaConsumeItem(id);
      arenaVisionTotems.push({
        x,y,
        radius:5,
        until:Date.now()+15000
      });
      arenaEffect(x,y,"totem",1);
      showMessage("👁️ Tótem de visión activado.");
      return true;

    case "portal":
      if(!arenaPortalFirst){
        arenaPortalFirst={x,y};
        showMessage("🌀 Primer portal colocado. Elige ahora el segundo extremo.");
        return true;
      }

      if(
        arenaPortalFirst.x===x&&
        arenaPortalFirst.y===y
      ){
        showMessage("🌀 El segundo extremo debe estar en otra casilla.");
        return true;
      }

      const first=arenaPortalFirst;
      arenaConsumeItem(id);
      arenaPortals.push({
        ax:first.x,
        ay:first.y,
        bx:x,
        by:y,
        until:Date.now()+20000
      });
      arenaPortalFirst=null;
      arenaEffect(first.x,first.y,"portal",1);
      arenaEffect(x,y,"portal",1);
      showMessage("🌀 Portal conectado.");
      return true;

    case "fireZone":
      arenaConsumeItem(id);
      arenaFireZones.push({
        x,y,
        radius:1,
        until:Date.now()+8000,
        nextTick:Date.now()+900
      });
      arenaEffect(x,y,"fire",1);
      showMessage("🔥 Zona de fuego activa.");
      return true;

    default:
      return false;
  }
}

function arenaUseItemOnCell(id,x,y){

  if(id==="impulse"){
    if(!isVisible(x,y)){
      showMessage("💨 Solo puedes usarlo dentro de tu zona de luz.");
      return true;
    }

    const target=units.find(u=>
      u.alive&&
      !u.deadAnimating&&
      u.army===playerArmy&&
      u.x===x&&
      u.y===y
    );

    if(!target){
      showMessage("💨 Selecciona una pieza aliada.");
      return true;
    }

    arenaConsumeItem(id);
    target.cooldown=Math.max(
      0,
      Number(target.cooldown||0)-3
    );
    arenaEffect(x,y,"impulse",.7);
    showMessage("💨 Cooldown reducido 3 segundos.");
    return true;
  }

  return arenaPlaceObject(id,x,y);
}

function arenaHandleClick(sx,sy){

  if(!arenaPlacementMode&& !arenaSelectedItem)
    return false;

  const world=screenToWorld(sx,sy);
  const cell=tileAtWorld(world.x,world.y);

  if(!inBounds(cell.x,cell.y))return true;

  if(arenaPlacementMode){

    if(arenaPlacementMode.kind==="piece")
      return arenaPlacePieceAt(cell.x,cell.y);

    if(arenaPlacementMode.kind==="bush")
      return arenaPlaceBushAt(cell.x,cell.y);
  }

  if(arenaSelectedItem){

    const id=arenaSelectedItem;

    if(
      id==="portal" &&
      arenaPortalFirst
    ){
      return arenaPlaceObject(id,cell.x,cell.y);
    }

    return arenaUseItemOnCell(id,cell.x,cell.y);
  }

  return false;
}

function arenaTriggerMine(u){

  if(!u||u.army===playerArmy)return;

  const mineIndex=arenaMines.findIndex(m=>m.x===u.x&&m.y===u.y);

  if(mineIndex>=0){
    arenaMines.splice(mineIndex,1);
    arenaDetonateBomb(u.x,u.y,1,"bombSmall");
    showMessage("🧨 ¡Una mina ha explotado!");
  }

  const trapIndex=arenaElectricTraps.findIndex(m=>m.x===u.x&&m.y===u.y);

  if(trapIndex>=0){
    arenaElectricTraps.splice(trapIndex,1);
    u.frozenUntil=Date.now()+1500;

    if(u.moving){
      u.moving=false;
      u.moveProgress=1;
      u.renderX=u.x;
      u.renderY=u.y;
      u.moveStartX=u.x;
      u.moveStartY=u.y;
      u.moveTargetX=u.x;
      u.moveTargetY=u.y;
      u.pendingEnemy=null;
    }

    arenaEffect(u.x,u.y,"electric",.9);
    showMessage("⚡ ¡Enemigo inmovilizado!");
  }
}

function arenaIsCellBlockedByWall(x,y){
  return arenaWalls.some(
    w=>
      w.x===x&&
      w.y===y&&
      Number(w.until||0)>Date.now()
  );
}

function arenaIsCellSmoked(x,y){

  for(const smoke of arenaSmokes){
    if(Number(smoke.until||0)<=Date.now())continue;

    if(
      Math.max(
        Math.abs(smoke.x-x),
        Math.abs(smoke.y-y)
      )<=smoke.radius
    )return true;
  }

  return false;
}

function arenaIsCellTotemVisible(x,y){

  for(const totem of arenaVisionTotems){
    if(Number(totem.until||0)<=Date.now())continue;

    if(
      Math.hypot(
        totem.x-x,
        totem.y-y
      )<=totem.radius
    )return true;
  }

  return false;
}

function arenaTeleportUnits(){

  for(const portal of arenaPortals){

    if(Number(portal.until||0)<=Date.now())
      continue;

    const ends=[
      [portal.ax,portal.ay,portal.bx,portal.by],
      [portal.bx,portal.by,portal.ax,portal.ay]
    ];

    for(const [ax,ay,bx,by] of ends){

      const u=units.find(unit=>
        unit.alive&&
        !unit.deadAnimating&&
        unit.army===playerArmy&&
        !unit.moving&&
        unit.x===ax&&
        unit.y===ay
      );

      if(!u)continue;

      if(
        units.some(other=>
          other!==u&&
          other.alive&&
          !other.deadAnimating&&
          other.x===bx&&
          other.y===by
        )
      )continue;

      if(!validCell(bx,by))continue;

      u.x=bx;
      u.y=by;
      u.renderX=bx;
      u.renderY=by;

      arenaEffect(bx,by,"portal",1);
      showMessage("🌀 ¡Teletransporte!");
      break;
    }
  }
}

function arenaFireTick(){

  const now=Date.now();

  for(const zone of arenaFireZones){

    if(zone.until<=now)continue;
    if(zone.nextTick>now)continue;

    zone.nextTick=now+1000;

    for(const enemy of arenaLivingEnemiesInRadius(zone.x,zone.y,zone.radius)){
      arenaEliminateEnemy(enemy,"fuego");
    }
  }
}

function arenaCleanupObjects(){

  const now=Date.now();

  arenaWalls=arenaWalls.filter(w=>w.until>now);
  arenaSmokes=arenaSmokes.filter(w=>w.until>now);
  arenaVisionTotems=arenaVisionTotems.filter(w=>w.until>now);
  arenaPortals=arenaPortals.filter(w=>w.until>now);
  arenaFireZones=arenaFireZones.filter(w=>w.until>now);

  arenaEffects=arenaEffects.filter(e=>e.life>0);

  for(const e of arenaEffects)
    e.life=Math.max(0,e.life-.035);
}

function arenaTick(dt){

  if(gameEnded)return;

  arenaEnsureMissionState();

  arenaTickTimer+=dt;
  arenaExploreTimer+=dt;

  if(arenaTickTimer>=.10){
    arenaTickTimer=0;

    for(const u of units){
      if(u.alive&&!u.deadAnimating)
        arenaTriggerMine(u);
    }

    arenaTeleportUnits();
    arenaFireTick();
    arenaCleanupObjects();
  }

  if(arenaExploreTimer>=.75){
    arenaExploreTimer=0;
    arenaUpdateExploration();
  }
}

/* =========================================================
   VISIÓN, ARBUSTOS Y VALIDACIÓN DE CASILLAS
========================================================= */

const arenaBaseIsBushCell=window.isBushCell;
window.isBushCell=function(x,y){
  if(arenaShrubs.some(s=>s.x===x&&s.y===y))return true;
  return arenaBaseIsBushCell(x,y);
};

const arenaBaseIsUnitHiddenFromArmy=window.isUnitHiddenFromArmy;
window.isUnitHiddenFromArmy=function(unit,viewerArmy){
  if(arenaBaseIsUnitHiddenFromArmy(unit,viewerArmy))
    return true;

  if(unit&&arenaIsCellSmoked(unit.x,unit.y))
    return unit.army!==viewerArmy;

  return false;
};

const arenaBaseIsVisible=window.isVisible;
window.isVisible=function(x,y){

  if(arenaIsCellSmoked(x,y))
    return false;

  if(arenaBaseIsVisible(x,y))
    return true;

  if(arenaIsCellTotemVisible(x,y))
    return true;

  return false;
};

const arenaBaseValidCell=window.validCell;
window.validCell=function(x,y,ignore=null){

  if(arenaIsCellBlockedByWall(x,y))
    return false;

  return arenaBaseValidCell(x,y,ignore);
};

/* =========================================================
   INPUT / RENDER / ACTUALIZACIÓN
========================================================= */

const arenaBaseHandleClick=window.handleClick;
window.handleClick=function(sx,sy){

  if(arenaHandleClick(sx,sy))
    return;

  arenaBaseHandleClick(sx,sy);
};

const arenaBaseDrawMap=window.drawMap;
window.drawMap=function(){

  arenaBaseDrawMap();

  arenaDrawOverlay();
};

const arenaBaseUpdate=window.update;
window.update=function(dt){

  arenaBaseUpdate(dt);
  arenaTick(dt);
};

const arenaBaseCapture=window.capture;
window.capture=function(attacker,defender){

  const wasAlive=Boolean(defender&&defender.alive);
  const result=arenaBaseCapture(attacker,defender);

  if(
    wasAlive&&
    defender&&
    defender.army!==playerArmy
  ){
    arenaRegisterKill();
  }

  return result;
};

const arenaBaseCollectChestAt=window.collectChestAt;
window.collectChestAt=function(x,y,u){

  const before=chests.find(c=>!c.collected&&c.x===x&&c.y===y);
  const wasUncollected=Boolean(before);

  const result=arenaBaseCollectChestAt(x,y,u);

  if(wasUncollected)
    arenaRegisterChest();

  return result;
};

const arenaBaseSaveSnapshot=window.saveSnapshot;
window.saveSnapshot=function(){
  const snapshot=arenaBaseSaveSnapshot();
  snapshot.arenaSystems=arenaStateSnapshot();
  return snapshot;
};

const arenaBaseRestoreSnapshot=window.restoreSnapshot;
window.restoreSnapshot=function(d){
  const result=arenaBaseRestoreSnapshot(d);
  if(result)restoreArenaSystemState(d);
  return result;
};

const arenaBaseRestartGame=window.restartGame;
window.restartGame=function(){
  arenaResetMatchState();
  return arenaBaseRestartGame();
};

function arenaResetMatchState(){

  arenaPlacementMode=null;
  arenaSelectedItem=null;
  arenaPortalFirst=null;

  arenaShrubs=[];
  arenaWalls=[];
  arenaMines=[];
  arenaElectricTraps=[];
  arenaIceBombs=[];
  arenaSmokes=[];
  arenaVisionTotems=[];
  arenaPortals=[];
  arenaFireZones=[];
  arenaEffects=[];

  arenaExploredCells=new Set();

  if(typeof playerArmy!=="undefined"&&playerArmy){
    /* El inventario y el loadout permanecen entre partidas. */
  }
}

/* Recuperación del guardado que ya pudo cargarse antes de este módulo. */
function arenaRecoverEarlySave(){

  try{
    const raw=localStorage.getItem(localSaveKey);
    if(!raw)return;

    const data=JSON.parse(raw);

    if(data&&data.arenaSystems)
      restoreArenaSystemState(data);
  }catch(e){
    console.warn("No se pudo recuperar el estado de objetos.",e);
  }
}

/* =========================================================
   UI
========================================================= */

function arenaInjectStyles(){

  if(document.getElementById("arenaSystemsStyles"))return;

  const style=document.createElement("style");
  style.id="arenaSystemsStyles";
  style.textContent=`
    #arenaBushButton{
      position:fixed;
      left:14px;
      bottom:86px;
      z-index:26;
      min-width:120px;
      height:42px;
      padding:0 14px;
      border:1px solid rgba(121,171,110,.65);
      border-radius:11px;
      background:linear-gradient(180deg,#354638,#202b23);
      color:#d7edc2;
      font:900 12px Arial,Helvetica,sans-serif;
      letter-spacing:.7px;
      cursor:pointer;
      box-shadow:0 7px 22px rgba(0,0,0,.42);
    }
    #arenaItemsButton{
      position:fixed;
      top:70px;
      right:14px;
      z-index:26;
      min-width:118px;
      height:42px;
      padding:0 14px;
      border:1px solid rgba(231,202,120,.65);
      border-radius:11px;
      background:linear-gradient(180deg,#3b414b,#20252c);
      color:#ffe39a;
      font:900 12px Arial,Helvetica,sans-serif;
      letter-spacing:.7px;
      cursor:pointer;
      box-shadow:0 7px 22px rgba(0,0,0,.42);
    }
    #arenaLoadout{
      position:fixed;
      left:50%;
      bottom:88px;
      transform:translateX(-50%);
      z-index:26;
      display:flex;
      gap:7px;
      padding:7px;
      border:1px solid rgba(231,202,120,.28);
      border-radius:13px;
      background:rgba(10,13,17,.82);
      backdrop-filter:blur(5px);
      box-shadow:0 8px 28px rgba(0,0,0,.4);
    }
    .arenaLoadoutSlot{
      min-width:70px;
      min-height:47px;
      padding:4px 8px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:9px;
      background:#252c34;
      color:#fff;
      cursor:pointer;
      font:800 10px Arial,Helvetica,sans-serif;
    }
    .arenaLoadoutSlot.active{
      border-color:#e7ca78;
      box-shadow:0 0 14px rgba(231,202,120,.18);
      background:#39404a;
    }
    .arenaLoadoutSlot strong{
      display:block;
      font-size:18px;
      line-height:20px;
    }
    .arenaMarketOverlay{
      position:fixed;
      inset:0;
      z-index:360;
      display:none;
      align-items:center;
      justify-content:center;
      padding:18px;
      background:rgba(4,7,10,.87);
      backdrop-filter:blur(7px);
    }
    .arenaMarketPanel{
      width:min(1120px,100%);
      max-height:92vh;
      overflow:auto;
      padding:20px;
      border:2px solid rgba(231,202,120,.55);
      border-radius:22px;
      background:linear-gradient(145deg,#252c35,#11151b);
      color:#f5f1e7;
      box-shadow:0 30px 100px rgba(0,0,0,.8);
      font-family:Arial,Helvetica,sans-serif;
    }
    .arenaMarketTop{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      margin-bottom:15px;
    }
    .arenaMarketTop h2{
      margin:0 0 4px;
      color:#e7ca78;
      font-family:Georgia,"Times New Roman",serif;
    }
    .arenaMarketBalance{
      padding:10px 14px;
      border-radius:10px;
      background:rgba(0,0,0,.28);
      border:1px solid rgba(231,202,120,.32);
      color:#f1d47f;
      font-weight:900;
    }
    .arenaTabs{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-bottom:15px;
    }
    .arenaTab{
      padding:9px 13px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:9px;
      background:#2d343d;
      color:#dfe4e7;
      font-weight:900;
      cursor:pointer;
    }
    .arenaTab.active{
      border-color:#e7ca78;
      color:#f1d47f;
      background:#3c4148;
    }
    .arenaItemGrid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;
    }
    .arenaItemCard{
      min-height:205px;
      padding:15px;
      border:1px solid rgba(255,255,255,.1);
      border-radius:14px;
      background:rgba(9,13,18,.72);
      display:flex;
      flex-direction:column;
    }
    .arenaItemIcon{
      font-size:38px;
      line-height:1;
    }
    .arenaItemCard h3{
      margin:9px 0 5px;
      color:#f4f0e5;
      font-size:15px;
    }
    .arenaItemCard p{
      margin:0;
      color:#aeb6bc;
      font-size:11px;
      line-height:1.45;
    }
    .arenaItemBottom{
      margin-top:auto;
      padding-top:12px;
    }
    .arenaItemOwned{
      margin-bottom:8px;
      color:#c7ccd0;
      font-size:11px;
    }
    .arenaItemActions{
      display:flex;
      gap:7px;
    }
    .arenaBuyButton,.arenaEquipButton,.arenaCloseButton{
      flex:1;
      min-height:35px;
      padding:7px 9px;
      border:1px solid rgba(255,255,255,.14);
      border-radius:8px;
      background:#303842;
      color:#fff;
      font-weight:900;
      cursor:pointer;
      font-size:10px;
    }
    .arenaBuyButton{
      border-color:rgba(231,202,120,.4);
      color:#f1d47f;
    }
    .arenaEquipButton.active{
      border-color:#9bc49a;
      color:#d2ebcd;
      background:#3a4a3d;
    }
    .arenaProgress{
      height:11px;
      margin:10px 0 7px;
      border:1px solid rgba(231,202,120,.26);
      border-radius:99px;
      overflow:hidden;
      background:#080b0f;
    }
    .arenaProgressFill{
      height:100%;
      width:0%;
      background:linear-gradient(90deg,#a57c32,#f3d37a,#fff1ad);
    }
    .arenaPassLevel{
      color:#f3d37a;
      font-weight:900;
      font-size:13px;
    }
    .arenaPassNote{
      color:#aeb6bc;
      font-size:11px;
    }
    .arenaMissionCard{
      margin-bottom:10px;
      padding:13px;
      border:1px solid rgba(255,255,255,.1);
      border-radius:12px;
      background:rgba(10,14,19,.68);
    }
    .arenaMissionTitle{
      color:#f4f0e5;
      font-weight:900;
      font-size:12px;
    }
    .arenaMissionMeta{
      display:flex;
      justify-content:space-between;
      gap:10px;
      margin-top:6px;
      color:#aeb6bc;
      font-size:10px;
    }
    .arenaMissionTrack{
      height:7px;
      margin-top:8px;
      overflow:hidden;
      border-radius:99px;
      background:#070a0e;
      border:1px solid rgba(255,255,255,.08);
    }
    .arenaMissionTrack div{
      height:100%;
      background:#d0a74d;
    }
    .arenaCloseButton{
      display:block;
      max-width:180px;
      margin:16px auto 0;
      background:linear-gradient(#e7c96f,#b48b3e);
      color:#211b10;
      border-color:#f0d98e;
      font-size:11px;
    }
    .arenaPlacementHint{
      position:fixed;
      left:50%;
      top:84px;
      transform:translateX(-50%);
      z-index:27;
      padding:9px 13px;
      border:1px solid rgba(231,202,120,.4);
      border-radius:10px;
      background:rgba(10,13,18,.86);
      color:#f1d47f;
      font:900 11px Arial,Helvetica,sans-serif;
      box-shadow:0 7px 22px rgba(0,0,0,.42);
      pointer-events:none;
    }
    @media(max-width:800px){
      .arenaItemGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:560px){
      .arenaItemGrid{grid-template-columns:1fr}
      #arenaLoadout{bottom:122px;max-width:95vw;overflow:auto}
      .arenaLoadoutSlot{min-width:62px}
      #arenaBushButton{bottom:124px}
      #arenaItemsButton{top:68px}
    }
  `;
  document.head.appendChild(style);
}

function arenaCreateUI(){

  if(document.getElementById("arenaSystemsPanel"))return;

  arenaInjectStyles();
  arenaCreateBushButton();

  const open=document.createElement("button");
  open.id="arenaItemsButton";
  open.type="button";
  open.textContent="💎 OBJETOS";
  open.addEventListener("click",()=>arenaOpenPanel("items"));
  document.body.appendChild(open);

  const loadout=document.createElement("div");
  loadout.id="arenaLoadout";
  document.body.appendChild(loadout);

  const hint=document.createElement("div");
  hint.id="arenaPlacementHint";
  hint.className="arenaPlacementHint";
  hint.style.display="none";
  document.body.appendChild(hint);

  const overlay=document.createElement("div");
  overlay.id="arenaSystemsPanel";
  overlay.className="arenaMarketOverlay";

  overlay.innerHTML=`
    <div class="arenaMarketPanel">
      <div class="arenaMarketTop">
        <div>
          <h2>💎 MERCADO DE ARENA</h2>
          <div class="arenaPassNote">Objetos tácticos, pase y misiones</div>
        </div>
        <div class="arenaMarketBalance">💎 <b id="arenaMarketDiamonds">0</b></div>
      </div>
      <div class="arenaTabs">
        <button class="arenaTab" data-tab="items">💣 OBJETOS</button>
        <button class="arenaTab" data-tab="pass">🎟️ PASE</button>
        <button class="arenaTab" data-tab="missions">📜 MISIONES</button>
      </div>
      <div id="arenaSystemsContent"></div>
      <button id="arenaClosePanel" class="arenaCloseButton" type="button">← CERRAR</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click",e=>{
    if(e.target===overlay)arenaClosePanel();
  });

  document.getElementById("arenaClosePanel")
    .addEventListener("click",arenaClosePanel);

  for(const tab of overlay.querySelectorAll(".arenaTab")){
    tab.addEventListener("click",()=>{
      arenaOpenPanel(tab.dataset.tab);
    });
  }

  renderArenaSystemsUI();
}

function arenaOpenPanel(tab="items"){

  arenaShopTab=tab;

  const panel=document.getElementById("arenaSystemsPanel");
  if(!panel)return;

  panel.style.display="flex";
  renderArenaSystemsUI();
}

function arenaClosePanel(){

  const panel=document.getElementById("arenaSystemsPanel");
  if(panel)panel.style.display="none";
}

function arenaRenderItems(){

  const content=document.getElementById("arenaSystemsContent");
  if(!content)return;

  let html="<div class='arenaItemGrid'>";

  for(const [id,def] of Object.entries(ARENA_ITEM_DEFS)){

    const owned=arenaCount(id);
    const equipped=arenaIsEquipped(id);

    html+=`
      <article class="arenaItemCard">
        <div class="arenaItemIcon">${def.icon}</div>
        <h3>${def.name}</h3>
        <p>${def.description}</p>
        <div class="arenaItemBottom">
          <div class="arenaItemOwned">Cargas: <b>${owned}</b> · ${def.price} 💎</div>
          <div class="arenaItemActions">
            <button class="arenaBuyButton" data-buy="${id}">
              COMPRAR · ${def.price} 💎
            </button>
            <button class="arenaEquipButton ${equipped?"active":""}" data-equip="${id}" ${owned?"":"disabled"}>
              ${equipped?"✓ EQUIPADO":"EQUIPAR"}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  html+="</div>";

  content.innerHTML=html;

  for(const button of content.querySelectorAll("[data-buy]")){
    button.addEventListener("click",()=>{
      arenaPurchaseItem(button.dataset.buy);
    });
  }

  for(const button of content.querySelectorAll("[data-equip]")){
    button.addEventListener("click",()=>{
      arenaEquipItem(button.dataset.equip);
    });
  }
}

function arenaRenderPass(){

  const content=document.getElementById("arenaSystemsContent");
  if(!content)return;

  const current=arenaPassXp;
  const percent=Math.min(
    100,
    current/ARENA_PASS_XP_PER_LEVEL*100
  );

  let html=`
    <div class="arenaPassLevel">
      ${ARENA_SEASON} · NIVEL ${arenaPassLevel}/${ARENA_PASS_MAX_LEVEL}
    </div>
    <div class="arenaProgress">
      <div class="arenaProgressFill" style="width:${percent}%"></div>
    </div>
    <div class="arenaPassNote">
      ${Math.floor(current)} / ${ARENA_PASS_XP_PER_LEVEL} XP para el siguiente nivel.
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:15px">
  `;

  for(let level=1;level<=ARENA_PASS_MAX_LEVEL;level++){

    const claimed=arenaClaimedPassLevels.includes(level);
    const reached=arenaPassLevel>=level;

    html+=`
      <div style="padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:${reached?"rgba(93,111,71,.42)":"rgba(10,14,19,.6)"};font-size:10px">
        <b>Nv. ${level}</b><br>
        <span style="color:#aeb6bc">${claimed?"✓ RECLAMADO":reached?"✓ DISPONIBLE":"🔒 BLOQUEADO"}</span>
      </div>
    `;
  }

  html+="</div>";
  content.innerHTML=html;
}

function arenaRenderMissions(){

  arenaEnsureMissionState();

  const content=document.getElementById("arenaSystemsContent");
  if(!content)return;

  let html="<h3 style='margin:0 0 10px;color:#e7ca78'>MISIONES DIARIAS</h3>";

  for(const mission of ARENA_MISSIONS.daily){
    const value=Math.min(
      mission.goal,
      Number(arenaMissionState.daily[mission.id])||0
    );
    const pct=value/mission.goal*100;
    html+=`
      <div class="arenaMissionCard">
        <div class="arenaMissionTitle">${mission.text}</div>
        <div class="arenaMissionMeta">
          <span>${value} / ${mission.goal}</span>
          <span>+${mission.reward} XP Pase</span>
        </div>
        <div class="arenaMissionTrack"><div style="width:${pct}%"></div></div>
      </div>
    `;
  }

  html+="<h3 style='margin:18px 0 10px;color:#e7ca78'>MISIONES SEMANALES</h3>";

  for(const mission of ARENA_MISSIONS.weekly){
    const value=Math.min(
      mission.goal,
      Number(arenaMissionState.weekly[mission.id])||0
    );
    const pct=value/mission.goal*100;
    html+=`
      <div class="arenaMissionCard">
        <div class="arenaMissionTitle">${mission.text}</div>
        <div class="arenaMissionMeta">
          <span>${value} / ${mission.goal}</span>
          <span>+${mission.reward} XP Pase</span>
        </div>
        <div class="arenaMissionTrack"><div style="width:${pct}%"></div></div>
      </div>
    `;
  }

  content.innerHTML=html;
}

function renderArenaSystemsUI(){

  arenaEnsureMissionState();

  const balance=document.getElementById("arenaMarketDiamonds");
  if(balance)
    balance.textContent=Math.max(0,Number(globalDiamonds)||0);

  const tabs=document.querySelectorAll(".arenaTab");
  for(const tab of tabs){
    tab.classList.toggle(
      "active",
      tab.dataset.tab===arenaShopTab
    );
  }

  if(arenaShopTab==="items")
    arenaRenderItems();
  else if(arenaShopTab==="pass")
    arenaRenderPass();
  else
    arenaRenderMissions();

  const loadout=document.getElementById("arenaLoadout");
  if(loadout){

    loadout.innerHTML="";

    for(let i=0;i<3;i++){

      const id=arenaLoadout[i];
      const button=document.createElement("button");
      button.type="button";
      button.className=
        "arenaLoadoutSlot"+
        (id===arenaSelectedItem?" active":"");

      if(id){
        const def=ARENA_ITEM_DEFS[id];
        button.innerHTML=
          "<strong>"+def.icon+"</strong>"+
          "<span>"+def.name+"</span><br>"+
          "<small>×"+arenaCount(id)+"</small>";

        button.addEventListener("click",()=>{
          if(arenaCount(id))
            arenaSelectItem(id);
        });
      }else{
        button.innerHTML="<strong>＋</strong><span>VACÍO</span>";
      }

      loadout.appendChild(button);
    }
  }

  const hint=document.getElementById("arenaPlacementHint");
  if(hint){

    if(arenaPlacementMode){
      hint.style.display="block";
      hint.textContent=
        arenaPlacementMode.kind==="piece"
        ?"🎯 Coloca "+arenaPlacementMode.type.toUpperCase()+" en la zona iluminada · ESC cancela"
        :"🌿 Coloca el arbusto en la zona iluminada · ESC cancela";
    }else if(arenaSelectedItem){
      hint.style.display="block";
      hint.textContent=
        ARENA_ITEM_DEFS[arenaSelectedItem].icon+
        " Coloca "+ARENA_ITEM_DEFS[arenaSelectedItem].name+
        " · ESC cancela";
    }else{
      hint.style.display="none";
    }
  }
}

function arenaDrawOverlay(){

  if(
    !arenaPlacementMode&&
    !arenaSelectedItem&&
    !arenaPortalFirst
  )return;

  const now=Date.now();

  /* Casillas de despliegue. */
  if(arenaPlacementMode){

    const left=Math.max(
      0,
      Math.floor((camera.x-W/(2*camera.zoom))/TILE)-1
    );
    const right=Math.min(
      MAP_W-1,
      Math.ceil((camera.x+W/(2*camera.zoom))/TILE)+1
    );
    const top=Math.max(
      0,
      Math.floor((camera.y-H/(2*camera.zoom))/TILE)-1
    );
    const bottom=Math.min(
      MAP_H-1,
      Math.ceil((camera.y+H/(2*camera.zoom))/TILE)+1
    );

    ctx.save();

    for(let y=top;y<=bottom;y++){
      for(let x=left;x<=right;x++){

        if(!arenaCanPlaceCell(x,y))continue;

        const p=worldToScreen(x*TILE,y*TILE);
        const s=TILE*camera.zoom;

        ctx.fillStyle=
          arenaPlacementMode.kind==="bush"
          ?"rgba(111,187,94,.12)"
          :"rgba(231,202,120,.10)";

        ctx.fillRect(p.x,p.y,s,s);

        ctx.strokeStyle=
          arenaPlacementMode.kind==="bush"
          ?"rgba(139,212,118,.4)"
          :"rgba(231,202,120,.38)";

        ctx.lineWidth=Math.max(1,camera.zoom);
        ctx.strokeRect(p.x+1,p.y+1,s-2,s-2);
      }
    }

    ctx.restore();
  }

  /* Primer extremo del portal. */
  if(arenaPortalFirst){

    const p=worldToScreen(
      arenaPortalFirst.x*TILE+TILE/2,
      arenaPortalFirst.y*TILE+TILE/2
    );
    const pulse=.75+Math.sin(now/130)*.2;

    ctx.save();
    ctx.strokeStyle="rgba(189,132,255,"+pulse+")";
    ctx.lineWidth=Math.max(2,3*camera.zoom);
    ctx.beginPath();
    ctx.arc(
      p.x,p.y,
      TILE*camera.zoom*.31,
      0,Math.PI*2
    );
    ctx.stroke();
    ctx.restore();
  }

  /* Zonas persistentes. */
  for(const smoke of arenaSmokes){
    if(Number(smoke.until||0)<=Date.now())continue;
    if(!isVisible(smoke.x,smoke.y))continue;

    const p=worldToScreen(
      smoke.x*TILE+TILE/2,
      smoke.y*TILE+TILE/2
    );
    const r=TILE*camera.zoom*(smoke.radius+.35);

    ctx.save();
    ctx.fillStyle="rgba(105,112,121,.12)";
    ctx.strokeStyle="rgba(167,176,188,.25)";
    ctx.lineWidth=Math.max(1,1.4*camera.zoom);
    ctx.beginPath();
    ctx.arc(p.x,p.y,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for(const zone of arenaFireZones){
    if(Number(zone.until||0)<=Date.now())continue;
    if(!isVisible(zone.x,zone.y))continue;

    const p=worldToScreen(
      zone.x*TILE+TILE/2,
      zone.y*TILE+TILE/2
    );
    const r=TILE*camera.zoom*(zone.radius+.15);

    ctx.save();
    ctx.fillStyle="rgba(255,77,20,.10)";
    ctx.strokeStyle="rgba(255,123,45,.35)";
    ctx.lineWidth=Math.max(1,1.5*camera.zoom);
    ctx.beginPath();
    ctx.arc(p.x,p.y,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for(const mine of arenaMines){
    if(!isVisible(mine.x,mine.y))continue;

    const p=worldToScreen(
      mine.x*TILE+TILE/2,
      mine.y*TILE+TILE/2
    );

    ctx.save();
    ctx.globalAlpha=.78;
    ctx.fillStyle="#393f46";
    ctx.strokeStyle="#f0b057";
    ctx.lineWidth=Math.max(1,1.2*camera.zoom);
    ctx.beginPath();
    ctx.arc(p.x,p.y,TILE*camera.zoom*.13,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for(const trap of arenaElectricTraps){
    if(!isVisible(trap.x,trap.y))continue;

    const p=worldToScreen(
      trap.x*TILE+TILE/2,
      trap.y*TILE+TILE/2
    );

    ctx.save();
    ctx.globalAlpha=.8;
    ctx.strokeStyle="#9bdcff";
    ctx.lineWidth=Math.max(1,1.3*camera.zoom);
    ctx.beginPath();
    ctx.moveTo(p.x-TILE*.14,p.y);
    ctx.lineTo(p.x-TILE*.04,p.y-TILE*.10);
    ctx.lineTo(p.x+TILE*.04,p.y+TILE*.10);
    ctx.lineTo(p.x+TILE*.14,p.y);
    ctx.stroke();
    ctx.restore();
  }

  /* Objetos dinámicos visibles para el jugador. */
  for(const shrub of arenaShrubs){
    if(!isVisible(shrub.x,shrub.y))continue;

    const p=worldToScreen(
      shrub.x*TILE+TILE/2,
      shrub.y*TILE+TILE/2
    );

    drawBush(
      p.x,
      p.y,
      TILE*camera.zoom*.95
    );
  }

  for(const totem of arenaVisionTotems){
    if(!isVisible(totem.x,totem.y))continue;

    const p=worldToScreen(
      totem.x*TILE+TILE/2,
      totem.y*TILE+TILE/2
    );

    ctx.save();
    ctx.globalAlpha=.8;
    ctx.strokeStyle="rgba(208,233,255,.85)";
    ctx.lineWidth=Math.max(1,2*camera.zoom);
    ctx.beginPath();
    ctx.arc(
      p.x,p.y,
      TILE*camera.zoom*.22,
      0,Math.PI*2
    );
    ctx.stroke();
    ctx.fillStyle="rgba(208,233,255,.18)";
    ctx.beginPath();
    ctx.arc(
      p.x,p.y,
      TILE*camera.zoom*.22,
      0,Math.PI*2
    );
    ctx.fill();
    ctx.restore();
  }

  for(const wall of arenaWalls){
    if(!isVisible(wall.x,wall.y))continue;

    const p=worldToScreen(
      wall.x*TILE,
      wall.y*TILE
    );
    const s=TILE*camera.zoom;

    ctx.save();
    ctx.fillStyle="rgba(42,45,50,.92)";
    ctx.strokeStyle="rgba(231,202,120,.45)";
    ctx.lineWidth=Math.max(1,1.5*camera.zoom);
    ctx.fillRect(
      p.x+s*.12,
      p.y+s*.16,
      s*.76,
      s*.68
    );
    ctx.strokeRect(
      p.x+s*.12,
      p.y+s*.16,
      s*.76,
      s*.68
    );
    ctx.restore();
  }

  for(const portal of arenaPortals){
    if(
      isVisible(portal.ax,portal.ay)
    ){
      arenaDrawPortalPoint(portal.ax,portal.ay);
    }

    if(
      isVisible(portal.bx,portal.by)
    ){
      arenaDrawPortalPoint(portal.bx,portal.by);
    }
  }

  for(const effect of arenaEffects){

    const p=worldToScreen(
      effect.x*TILE+TILE/2,
      effect.y*TILE+TILE/2
    );

    if(
      p.x<-TILE||
      p.y<-TILE||
      p.x>W+TILE||
      p.y>H+TILE||
      !isVisible(effect.x,effect.y)
    )continue;

    const progress=1-effect.life/effect.maxLife;
    const r=TILE*camera.zoom*effect.radius*(.5+progress);
    const alpha=Math.max(0,1-progress);

    ctx.save();

    if(effect.type==="bombSmall"||effect.type==="bombBig"){
      ctx.strokeStyle="rgba(255,160,65,"+(.55*alpha)+")";
      ctx.fillStyle="rgba(255,107,32,"+(.10*alpha)+")";
    }else if(effect.type==="iceBomb"){
      ctx.strokeStyle="rgba(194,235,255,"+(.7*alpha)+")";
      ctx.fillStyle="rgba(194,235,255,"+(.13*alpha)+")";
    }else if(effect.type==="fire"){
      ctx.strokeStyle="rgba(255,105,36,"+(.65*alpha)+")";
      ctx.fillStyle="rgba(255,72,22,"+(.12*alpha)+")";
    }else if(effect.type==="electric"){
      ctx.strokeStyle="rgba(155,221,255,"+(.8*alpha)+")";
      ctx.fillStyle="rgba(155,221,255,"+(.1*alpha)+")";
    }else{
      ctx.strokeStyle="rgba(214,194,255,"+(.65*alpha)+")";
      ctx.fillStyle="rgba(214,194,255,"+(.08*alpha)+")";
    }

    ctx.lineWidth=Math.max(1,2*camera.zoom);
    ctx.beginPath();
    ctx.arc(p.x,p.y,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

function arenaDrawPortalPoint(x,y){

  const p=worldToScreen(
    x*TILE+TILE/2,
    y*TILE+TILE/2
  );

  const now=performance.now()/700;

  ctx.save();

  ctx.strokeStyle="rgba(193,145,255,.8)";
  ctx.lineWidth=Math.max(1,2*camera.zoom);
  ctx.beginPath();
  ctx.arc(
    p.x,p.y,
    TILE*camera.zoom*(.20+.04*Math.sin(now+x+y)),
    0,Math.PI*2
  );
  ctx.stroke();

  ctx.fillStyle="rgba(193,145,255,.15)";
  ctx.beginPath();
  ctx.arc(
    p.x,p.y,
    TILE*camera.zoom*.22,
    0,Math.PI*2
  );
  ctx.fill();

  ctx.restore();
}

/* =========================================================
   ESC / INICIALIZACIÓN
========================================================= */

document.addEventListener("keydown",e=>{

  if(e.key==="Escape"){

    if(
      arenaPlacementMode||
      arenaSelectedItem||
      arenaPortalFirst
    ){
      arenaPlacementMode=null;
      arenaSelectedItem=null;
      arenaPortalFirst=null;
      renderArenaSystemsUI();
      showMessage("❌ Acción cancelada.");
    }
  }
});

document.addEventListener("DOMContentLoaded",()=>{

  arenaRecoverEarlySave();
  arenaEnsureMissionState();
  arenaCreateUI();
  renderArenaSystemsUI();

  try{
    const startInstructions=document.getElementById("startInstructions");
    if(startInstructions){
      const text=startInstructions.querySelector(".instructionsText");
      if(text){
        const extra=document.createElement("span");
        extra.innerHTML="<b>DESPLIEGUE</b> Elige una pieza y colócala en tu zona iluminada";
        text.appendChild(extra);
      }
    }
  }catch(e){}

  if(typeof updateUI==="function")
    updateUI();
});
