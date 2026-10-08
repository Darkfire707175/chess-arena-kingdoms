/* =========================================================
   DIBUJO DEL TERRENO
========================================================= */

function drawTile(x,y){

  const t=terrain[y][x];

  const p=worldToScreen(x*TILE,y*TILE);
  const s=TILE*camera.zoom;

  if(p.x+s<0||p.y+s<0||p.x>W||p.y>H)return;

  if(t==="chessWhite"){
    ctx.fillStyle="#d9d4c6";
    ctx.fillRect(p.x,p.y,s,s);
  }

  else if(t==="chessBlack"){
    ctx.fillStyle="#83796d";
    ctx.fillRect(p.x,p.y,s,s);
  }

  else if(t==="grass"){

    const n=noise(x,y,.16);
    const g=112+Math.floor(n*18);

    ctx.fillStyle=
      `rgb(${74+Math.floor(n*8)},${g},${67+Math.floor(n*10)})`;

    ctx.fillRect(p.x,p.y,s,s);

    ctx.strokeStyle="rgba(32,72,39,.28)";
    ctx.lineWidth=Math.max(.6,camera.zoom);

    for(let i=0;i<3;i++){

      const n1=hashNoise(x*5+i,y*7+i);
      const n2=hashNoise(x*9+i,y*3+i);

      const gx=p.x+n1*s;
      const gy=p.y+n2*s;

      ctx.beginPath();
      ctx.moveTo(gx,gy+3*camera.zoom);
      ctx.lineTo(
        gx+(n1-.5)*4*camera.zoom,
        gy-3*camera.zoom
      );
      ctx.stroke();
    }

  }else if(t==="dirt"){

    ctx.fillStyle="#927151";
    ctx.fillRect(p.x,p.y,s,s);

    ctx.fillStyle="rgba(65,43,29,.12)";

    for(let i=0;i<4;i++){

      const nx=hashNoise(x+i*7,y+i*5);

      ctx.beginPath();
      ctx.arc(
        p.x+nx*s,
        p.y+hashNoise(y+i*9,x+i)*s,
        .8*camera.zoom,
        0,Math.PI*2
      );
      ctx.fill();
    }

  }else if(t==="water"){

    const grad=ctx.createLinearGradient(
      p.x,p.y,p.x,p.y+s
    );

    grad.addColorStop(0,"#4f9fba");
    grad.addColorStop(.5,"#367f9b");
    grad.addColorStop(1,"#245d78");

    ctx.fillStyle=grad;
    ctx.fillRect(p.x,p.y,s,s);

    ctx.strokeStyle="rgba(207,244,255,.2)";
    ctx.lineWidth=Math.max(.7,camera.zoom);

    const yy=p.y+s*(.3+noise(x,y)*.3);

    ctx.beginPath();
    ctx.moveTo(p.x+s*.1,yy);
    ctx.quadraticCurveTo(
      p.x+s*.5,
      yy-3*camera.zoom,
      p.x+s*.9,
      yy
    );
    ctx.stroke();

  }else if(t==="sand"||t==="sandDark"){

    const n=
      noise(x,y,.035)*.55+
      noise(x,y,.12)*.3+
      noise(x,y,.5)*.15;

    const r=218+Math.floor(n*5);
    const g=190+Math.floor(n*6);
    const b=126+Math.floor(n*5);

    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(p.x,p.y,s+.5,s+.5);

  }else if(t==="ash"){

    const n=noise(x,y,.12);

    ctx.fillStyle=
      `rgb(${63+Math.floor(n*14)},${59+Math.floor(n*11)},${57+Math.floor(n*10)})`;

    ctx.fillRect(p.x,p.y,s,s);

  }else if(t==="volcanicRock"){

    ctx.fillStyle="#3b3030";
    ctx.fillRect(p.x,p.y,s,s);

    ctx.strokeStyle="rgba(0,0,0,.2)";
    ctx.strokeRect(p.x,p.y,s,s);

  }else if(t==="lava"){

    const grad=ctx.createLinearGradient(
      p.x,p.y,p.x+s,p.y+s
    );

    grad.addColorStop(0,"#7e180e");
    grad.addColorStop(.5,"#d23d12");
    grad.addColorStop(1,"#6c1009");

    ctx.fillStyle=grad;
    ctx.fillRect(p.x,p.y,s,s);

    ctx.strokeStyle="rgba(255,174,49,.32)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    ctx.beginPath();

    ctx.moveTo(
      p.x+s*.1,
      p.y+s*.65
    );

    ctx.quadraticCurveTo(
      p.x+s*.5,
      p.y+s*.35,
      p.x+s*.9,
      p.y+s*.6
    );

    ctx.stroke();
  }
}

/* =========================================================
   DECORACIÓN
   SIN CAMBIOS
========================================================= */

function drawDecorations(){

  for(let y=0;y<MAP_H;y++){

    for(const d of terrainDecor[y]){

      const p=worldToScreen(
        d.x*TILE+TILE/2,
        d.y*TILE+TILE/2
      );

      const s=TILE*camera.zoom*d.scale;

      if(
        p.x+s<0||p.y+s<0||
        p.x-s>W||p.y-s>H
      )continue;

      if(d.type==="tree")drawTree(p.x,p.y,s);
      else if(d.type==="bush")drawBush(p.x,p.y,s);
      else if(d.type==="flower")drawFlower(p.x,p.y,s);
      else if(d.type==="cactus")drawCactus(p.x,p.y,s);
      else if(d.type==="desertRock")drawDesertRock(p.x,p.y,s);
      else if(d.type==="crack")drawCrack(p.x,p.y,s);
      else if(d.type==="ember")drawEmber(p.x,p.y,s);
    }
  }
}

function drawTree(x,y,s){

  ctx.fillStyle="rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.35,s*.34,s*.12,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#65452c";
  ctx.fillRect(x-s*.09,y-s*.15,s*.18,s*.55);

  const grad=ctx.createRadialGradient(
    x-s*.1,y-s*.2,s*.04,x,y,s*.5
  );

  grad.addColorStop(0,"#70a34b");
  grad.addColorStop(.7,"#39743d");
  grad.addColorStop(1,"#214d31");

  ctx.fillStyle=grad;

  ctx.beginPath();
  ctx.arc(x-s*.2,y-s*.1,s*.3,0,Math.PI*2);
  ctx.arc(x+s*.15,y-s*.2,s*.35,0,Math.PI*2);
  ctx.arc(x,y-s*.4,s*.3,0,Math.PI*2);
  ctx.fill();
}

function drawBush(x,y,s){

  ctx.fillStyle="#315f39";

  ctx.beginPath();
  ctx.arc(x-s*.2,y,s*.25,0,Math.PI*2);
  ctx.arc(x+s*.15,y-s*.04,s*.3,0,Math.PI*2);
  ctx.arc(x,y-s*.18,s*.27,0,Math.PI*2);
  ctx.fill();
}

function drawFlower(x,y,s){

  ctx.strokeStyle="#3e753e";
  ctx.lineWidth=Math.max(1,s*.035);

  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x,y-s*.3);
  ctx.stroke();

  ctx.fillStyle="#e5a7c1";

  for(let i=0;i<5;i++){

    const a=i*Math.PI*2/5;

    ctx.beginPath();
    ctx.arc(
      x+Math.cos(a)*s*.08,
      y-s*.31+Math.sin(a)*s*.08,
      s*.07,0,Math.PI*2
    );
    ctx.fill();
  }

  ctx.fillStyle="#e6c75b";
  ctx.beginPath();
  ctx.arc(x,y-s*.31,s*.05,0,Math.PI*2);
  ctx.fill();
}

function drawCactus(x,y,s){

  ctx.fillStyle="rgba(0,0,0,.16)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.28,s*.3,s*.1,0,0,Math.PI*2);
  ctx.fill();

  const grad=ctx.createLinearGradient(
    x-s*.15,y,x+s*.15,y
  );

  grad.addColorStop(0,"#3f7040");
  grad.addColorStop(.5,"#6e9850");
  grad.addColorStop(1,"#2f5e39");

  ctx.fillStyle=grad;

  ctx.beginPath();
  ctx.roundRect(
    x-s*.1,y-s*.45,s*.2,s*.75,s*.09
  );
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(
    x-s*.32,y-s*.18,s*.2,s*.11,s*.05
  );
  ctx.fill();

  ctx.fillRect(x-s*.32,y-s*.28,s*.1,s*.2);

  ctx.beginPath();
  ctx.roundRect(
    x+s*.12,y-s*.08,s*.2,s*.11,s*.05
  );
  ctx.fill();

  ctx.fillRect(x+s*.22,y-s*.18,s*.1,s*.2);

  ctx.strokeStyle="rgba(225,225,180,.35)";
  ctx.lineWidth=Math.max(.5,camera.zoom);

  for(let i=0;i<7;i++){

    const yy=y-s*.32+i*s*.09;

    ctx.beginPath();
    ctx.moveTo(x-s*.07,yy);
    ctx.lineTo(x-s*.11,yy+s*.025);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x+s*.07,yy+s*.02);
    ctx.lineTo(x+s*.11,yy);
    ctx.stroke();
  }
}

function drawDesertRock(x,y,s){

  ctx.fillStyle="rgba(0,0,0,.18)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.23,s*.35,s*.12,0,0,Math.PI*2);
  ctx.fill();

  const grad=ctx.createLinearGradient(
    x-s*.3,y-s*.3,x+s*.25,y+s*.25
  );

  grad.addColorStop(0,"#c6aa76");
  grad.addColorStop(.5,"#947952");
  grad.addColorStop(1,"#594735");

  ctx.fillStyle=grad;

  ctx.beginPath();
  ctx.moveTo(x-s*.36,y+s*.12);
  ctx.lineTo(x-s*.27,y-s*.16);
  ctx.lineTo(x-s*.05,y-s*.34);
  ctx.lineTo(x+s*.24,y-s*.25);
  ctx.lineTo(x+s*.37,y+s*.05);
  ctx.lineTo(x+s*.18,y+s*.23);
  ctx.lineTo(x-s*.18,y+s*.25);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle="rgba(255,230,177,.25)";
  ctx.lineWidth=Math.max(.7,camera.zoom);

  ctx.beginPath();
  ctx.moveTo(x-s*.2,y-s*.13);
  ctx.lineTo(x,y-s*.23);
  ctx.lineTo(x+s*.16,y-s*.13);
  ctx.stroke();
}

function drawCrack(x,y,s){

  ctx.strokeStyle="rgba(35,30,25,.25)";
  ctx.lineWidth=Math.max(.7,camera.zoom);

  ctx.beginPath();
  ctx.moveTo(x-s*.35,y-s*.2);
  ctx.lineTo(x-s*.05,y);
  ctx.lineTo(x-s*.12,y+s*.27);
  ctx.moveTo(x-s*.05,y);
  ctx.lineTo(x+s*.28,y-s*.18);
  ctx.stroke();
}

function drawEmber(x,y,s){

  ctx.fillStyle="rgba(255,91,25,.7)";
  ctx.beginPath();
  ctx.arc(x,y,s*.06,0,Math.PI*2);
  ctx.fill();
}

/* =========================================================
   ATMÓSFERA Y PROFUNDIDAD DEL MAPA
   CAPA VISUAL — NO CAMBIA LAS TEXTURAS BASE
========================================================= */

function drawBiomeTransitions(){

  const midWorldX=MID_X*TILE;
  const midWorldY=MID_Y*TILE;
  const band=TILE*2.2;

  ctx.save();

  /* Tablero -> bosque. */
  let a=worldToScreen(midWorldX-band,midWorldY-band);
  let b=worldToScreen(midWorldX+band,midWorldY+band);
  let g=ctx.createLinearGradient(a.x,0,b.x,0);
  g.addColorStop(0,"rgba(226,219,195,0)");
  g.addColorStop(.5,"rgba(92,125,74,.09)");
  g.addColorStop(1,"rgba(57,104,64,0)");
  ctx.fillStyle=g;
  ctx.fillRect(a.x,-10,b.x-a.x,H+20);

  /* Bosque -> zona volcánica. */
  g=ctx.createLinearGradient(0,a.y,0,b.y);
  g.addColorStop(0,"rgba(67,111,65,0)");
  g.addColorStop(.5,"rgba(87,61,48,.075)");
  g.addColorStop(1,"rgba(111,47,26,0)");
  ctx.fillStyle=g;
  ctx.fillRect(-10,a.y,W+20,b.y-a.y);

  /* Tablero -> desierto. */
  g=ctx.createLinearGradient(0,a.y,0,b.y);
  g.addColorStop(0,"rgba(154,135,101,0)");
  g.addColorStop(.5,"rgba(188,151,84,.085)");
  g.addColorStop(1,"rgba(218,180,108,0)");
  ctx.fillStyle=g;
  ctx.fillRect(-10,a.y,W+20,b.y-a.y);

  /* Desierto -> volcánico. */
  g=ctx.createLinearGradient(a.x,0,b.x,0);
  g.addColorStop(0,"rgba(191,145,77,0)");
  g.addColorStop(.5,"rgba(112,75,49,.08)");
  g.addColorStop(1,"rgba(67,37,31,0)");
  ctx.fillStyle=g;
  ctx.fillRect(a.x,-10,b.x-a.x,H+20);

  ctx.restore();
}

function drawBiomeLighting(left,right,top,bottom){

  const now=performance.now()/1000;

  ctx.save();

  /* Brillo ambiental sutil del bosque. */
  const forest=worldToScreen(78*TILE,18*TILE);
  let rg=ctx.createRadialGradient(
    forest.x,forest.y,0,
    forest.x,forest.y,11*TILE*camera.zoom
  );
  rg.addColorStop(0,"rgba(111,160,81,.08)");
  rg.addColorStop(1,"rgba(111,160,81,0)");
  ctx.fillStyle=rg;
  ctx.beginPath();
  ctx.arc(
    forest.x,forest.y,
    11*TILE*camera.zoom,
    0,Math.PI*2
  );
  ctx.fill();

  /* Calor ambiental del desierto. */
  const desert=worldToScreen(25*TILE,59*TILE);
  const desertPulse=.8+Math.sin(now*.55)*.2;
  rg=ctx.createRadialGradient(
    desert.x,desert.y,0,
    desert.x,desert.y,13*TILE*camera.zoom
  );
  rg.addColorStop(0,"rgba(255,224,150,.07)");
  rg.addColorStop(1,"rgba(255,224,150,0)");
  ctx.globalAlpha=desertPulse;
  ctx.fillStyle=rg;
  ctx.beginPath();
  ctx.arc(
    desert.x,desert.y,
    13*TILE*camera.zoom,
    0,Math.PI*2
  );
  ctx.fill();
  ctx.globalAlpha=1;

  /* Resplandor suave alrededor de la lava visible. */
  for(let y=top;y<=bottom;y++){
    if(y<0||y>=MAP_H)continue;

    for(let x=left;x<=right;x++){

      if(
        x<0||x>=MAP_W||
        terrain[y][x]!=="lava"||
        (x+y)%3!==0
      )continue;

      const p=worldToScreen(
        x*TILE+TILE/2,
        y*TILE+TILE/2
      );

      const radius=TILE*2.4*camera.zoom;
      const pulse=.65+Math.sin(now*2.4+x*.7+y*.41)*.12;

      rg=ctx.createRadialGradient(
        p.x,p.y,0,
        p.x,p.y,radius
      );
      rg.addColorStop(0,"rgba(255,94,35,.14)");
      rg.addColorStop(1,"rgba(255,61,18,0)");
      ctx.globalAlpha=pulse;
      ctx.fillStyle=rg;
      ctx.beginPath();
      ctx.arc(p.x,p.y,radius,0,Math.PI*2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawBiomeLandmarks(){

  const landmarks=[
    {kind:"forest",x:61,y:8,s:1.15},
    {kind:"forest",x:94,y:12,s:1.0},
    {kind:"desert",x:10,y:55,s:1.15},
    {kind:"desert",x:38,y:72,s:1.0},
    {kind:"volcano",x:62,y:67,s:1.12},
    {kind:"volcano",x:93,y:52,s:1.0},
    {kind:"chess",x:14,y:16,s:.95},
    {kind:"chess",x:38,y:28,s:.9}
  ];

  for(const landmark of landmarks){

    if(!inBounds(landmark.x,landmark.y))continue;

    const p=worldToScreen(
      landmark.x*TILE+TILE/2,
      landmark.y*TILE+TILE/2
    );

    const s=TILE*camera.zoom*landmark.s;

    if(
      p.x+s*2<0||
      p.y+s*2<0||
      p.x-s*2>W||
      p.y-s*2>H
    )continue;

    if(landmark.kind==="forest")
      drawForestLandmark(p.x,p.y,s);
    else if(landmark.kind==="desert")
      drawDesertLandmark(p.x,p.y,s);
    else if(landmark.kind==="volcano")
      drawVolcanoLandmark(p.x,p.y,s);
    else
      drawChessLandmark(p.x,p.y,s);
  }
}

function drawForestLandmark(x,y,s){

  ctx.save();

  ctx.fillStyle="rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.28,s*.52,s*.16,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#475e43";
  ctx.beginPath();
  ctx.arc(x,y,s*.32,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="rgba(167,198,124,.35)";
  ctx.lineWidth=Math.max(1,1.8*camera.zoom);
  ctx.beginPath();
  ctx.arc(x,y,s*.32,0,Math.PI*2);
  ctx.stroke();

  ctx.fillStyle="#2e5a35";
  ctx.beginPath();
  ctx.arc(x-s*.14,y-s*.1,s*.19,0,Math.PI*2);
  ctx.arc(x+s*.14,y-s*.11,s*.2,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawDesertLandmark(x,y,s){

  ctx.save();

  ctx.fillStyle="rgba(70,45,25,.25)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.32,s*.55,s*.15,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#9d7746";
  ctx.fillRect(x-s*.42,y-s*.12,s*.17,s*.45);
  ctx.fillRect(x+s*.25,y-s*.12,s*.17,s*.45);

  ctx.fillStyle="#c4a06a";
  ctx.beginPath();
  ctx.moveTo(x-s*.45,y-s*.12);
  ctx.quadraticCurveTo(x,y-s*.58,x+s*.45,y-s*.12);
  ctx.lineTo(x+s*.30,y-s*.12);
  ctx.quadraticCurveTo(x,y-s*.35,x-s*.30,y-s*.12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle="rgba(255,220,155,.27)";
  ctx.lineWidth=Math.max(1,1.3*camera.zoom);
  ctx.stroke();

  ctx.restore();
}

function drawVolcanoLandmark(x,y,s){

  const now=performance.now()/1000;
  const pulse=.65+Math.sin(now*2.2+x*.04)*.12;

  ctx.save();

  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.28,s*.58,s*.18,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#302526";
  ctx.beginPath();
  ctx.moveTo(x-s*.52,y+s*.14);
  ctx.lineTo(x-s*.28,y-s*.30);
  ctx.lineTo(x,y-s*.44);
  ctx.lineTo(x+s*.30,y-s*.26);
  ctx.lineTo(x+s*.52,y+s*.14);
  ctx.closePath();
  ctx.fill();

  const glow=ctx.createRadialGradient(
    x,y-s*.07,0,
    x,y-s*.07,s*.55
  );
  glow.addColorStop(0,"rgba(255,86,24,.18)");
  glow.addColorStop(1,"rgba(255,86,24,0)");
  ctx.globalAlpha=pulse;
  ctx.fillStyle=glow;
  ctx.beginPath();
  ctx.arc(x,y-s*.07,s*.55,0,Math.PI*2);
  ctx.fill();

  ctx.globalAlpha=1;
  ctx.fillStyle="#d34b1b";
  ctx.beginPath();
  ctx.ellipse(x,y-s*.13,s*.19,s*.08,0,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawChessLandmark(x,y,s){

  ctx.save();

  ctx.fillStyle="rgba(0,0,0,.16)";
  ctx.beginPath();
  ctx.ellipse(x,y+s*.28,s*.48,s*.14,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="rgba(111,100,86,.62)";
  ctx.fillRect(x-s*.38,y-s*.13,s*.76,s*.32);

  ctx.fillStyle="rgba(221,214,196,.42)";
  ctx.fillRect(x-s*.29,y-s*.26,s*.58,s*.12);

  ctx.strokeStyle="rgba(255,247,224,.32)";
  ctx.lineWidth=Math.max(1,1.2*camera.zoom);
  ctx.strokeRect(x-s*.37,y-s*.14,s*.74,s*.32);

  ctx.restore();
}

function drawAnimatedBiomeParticles(left,right,top,bottom){

  const now=performance.now()/1000;

  ctx.save();

  for(let i=0;i<30;i++){

    const px=hashNoise(i*9.73,21.4);
    const py=hashNoise(i*17.17,63.8);

    const qx=Math.floor(left+(right-left)*px);
    const qy=Math.floor(top+(bottom-top)*py);

    if(!inBounds(qx,qy))continue;

    const q=quadrant(qx,qy);
    let x=qx*TILE+TILE/2;
    let y=qy*TILE+TILE/2;
    let alpha=0;
    let radius=1.2*camera.zoom;

    if(q==="wonder"){
      y+=Math.sin(now*.8+i)*TILE*.12;
      x+=Math.cos(now*.55+i)*TILE*.08;
      alpha=.12;
    }else if(q==="desert"){
      x+=((now*7+i*13)%22)*camera.zoom;
      y+=Math.sin(now*.55+i)*TILE*.04;
      alpha=.09;
    }else if(q==="volcano"){
      y-=((now*(7+i%4)+i*19)%32)*camera.zoom;
      x+=Math.sin(now*1.4+i)*TILE*.05;
      alpha=.16;
      radius=1.4*camera.zoom;
    }else{
      continue;
    }

    const p=worldToScreen(x,y);

    if(p.x<0||p.y<0||p.x>W||p.y>H)continue;

    ctx.globalAlpha=alpha;

    if(q==="wonder")
      ctx.fillStyle="#d8ef91";
    else if(q==="desert")
      ctx.fillStyle="#f4d59a";
    else
      ctx.fillStyle="#ff7d36";

    ctx.beginPath();
    ctx.arc(p.x,p.y,radius,0,Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}
