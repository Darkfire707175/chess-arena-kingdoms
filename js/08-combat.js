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
