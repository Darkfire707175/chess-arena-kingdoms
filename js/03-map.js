/* =========================================================
   UTILIDADES
========================================================= */

function clamp(v,a,b){
  return Math.max(a,Math.min(b,v));
}

function rand(a,b){
  return a+Math.random()*(b-a);
}

function noise(x,y,s=1){
  const n=Math.sin(x*127.1*s+y*311.7*s)*43758.5453123;
  return n-Math.floor(n);
}

function hashNoise(x,y){
  const n=Math.sin(x*127.1+y*311.7)*43758.5453123;
  return n-Math.floor(n);
}

function dist(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

function worldToScreen(x,y){
  /*
    VISTA BRAWL:
    cámara cenital/ortográfica, sin perspectiva 3D.
    Todo el mundo mantiene la misma escala y la cámara sigue
    suavemente al personaje.
  */
  return {
    x:(x-camera.x)*camera.zoom+W/2,
    y:(y-camera.y)*camera.zoom+H/2
  };
}

function screenToWorld(x,y){
  return {
    x:(x-W/2)/camera.zoom+camera.x,
    y:(y-H/2)/camera.zoom+camera.y
  };
}

function tileAtWorld(x,y){
  return {
    x:Math.floor(x/TILE),
    y:Math.floor(y/TILE)
  };
}

function inBounds(x,y){
  return x>=0&&y>=0&&x<MAP_W&&y<MAP_H;
}

function quadrant(x,y){
  if(x<MID_X&&y<MID_Y)return "chess";
  if(x>=MID_X&&y<MID_Y)return "wonder";
  if(x<MID_X&&y>=MID_Y)return "desert";
  return "volcano";
}

/*
  Ahora también tenemos en cuenta unidades que están
  realizando una animación de movimiento.
*/
function occupied(x,y,ignore=null){
  return units.some(u=>
    u!==ignore &&
    u.alive &&
    !u.deadAnimating &&
    u.x===x &&
    u.y===y
  );
}

/* =========================================================
   TERRENO
   EXACTAMENTE EL MISMO DISEÑO/TEXTURAS
========================================================= */

function generateTerrain(){

  terrain=Array.from(
    {length:MAP_H},
    ()=>Array(MAP_W).fill("grass")
  );

  terrainDecor=Array.from(
    {length:MAP_H},
    ()=>[]
  );

  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){

      const q=quadrant(x,y);

      if(q==="chess"){

        terrain[y][x]=(x+y)%2===0
          ?"chessWhite"
          :"chessBlack";

        if(Math.random()<.012){
          terrainDecor[y].push({
            type:"crack",
            x,y,scale:rand(.5,1)
          });
        }

      }else if(q==="wonder"){

        terrain[y][x]="grass";

        const n=noise(x,y,.08);

        if(n<.08) terrain[y][x]="dirt";

        if(Math.random()<.055){
          terrainDecor[y].push({
            type:"tree",x,y,scale:rand(.75,1.25)
          });
        }

        if(Math.random()<.095){
          terrainDecor[y].push({
            type:"bush",x,y,scale:rand(.7,1.15)
          });
        }

        if(Math.random()<.045){
          terrainDecor[y].push({
            type:"flower",x,y,scale:rand(.6,1)
          });
        }

        if(
          (x-72)*(x-72)+(y-18)*(y-18)<40 ||
          (x-87)*(x-87)+(y-31)*(y-31)<30 ||
          (x-62)*(x-62)+(y-35)*(y-35)<24
        ){
          terrain[y][x]="water";
        }

      }else if(q==="desert"){

        terrain[y][x]="sand";

        if(noise(x,y,.035)<.025){
          terrain[y][x]="sandDark";
        }

        if(Math.random()<.028){
          terrainDecor[y].push({
            type:"cactus",x,y,scale:rand(.7,1.15)
          });
        }

        if(Math.random()<.025){
          terrainDecor[y].push({
            type:"desertRock",x,y,scale:rand(.65,1.25)
          });
        }

      }else{

        terrain[y][x]="ash";

        const n=noise(x,y,.07);

        if(n<.08) terrain[y][x]="volcanicRock";

        if(
          (x-77)*(x-77)+(y-62)*(y-62)<60 ||
          (x-91)*(x-91)+(y-91)*(y-91)<60
        ){
          terrain[y][x]="lava";
        }

        if(Math.random()<.035){
          terrainDecor[y].push({
            type:"ember",x,y,scale:rand(.5,1)
          });
        }
      }
    }
  }
}

/* =========================================================
   ARENA DE DESIERTO
   SIN CAMBIOS VISUALES
========================================================= */

function drawDesertTexture(){

  const leftWorld=0;
  const rightWorld=MID_X*TILE;
  const topWorld=MID_Y*TILE;
  const bottomWorld=MAP_H*TILE;

  const a=worldToScreen(leftWorld,topWorld);
  const b=worldToScreen(rightWorld,bottomWorld);

  ctx.save();

  ctx.beginPath();
  ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);
  ctx.clip();

  const startX=Math.max(
    0,
    Math.floor((camera.x-W/(2*camera.zoom))/TILE)-2
  );

  const endX=Math.min(
    MID_X-1,
    Math.ceil((camera.x+W/(2*camera.zoom))/TILE)+2
  );

  const startY=Math.max(
    MID_Y,
    Math.floor((camera.y-H/(2*camera.zoom))/TILE)-2
  );

  const endY=Math.min(
    MAP_H-1,
    Math.ceil((camera.y+H/(2*camera.zoom))/TILE)+2
  );

  for(let y=startY;y<=endY;y+=2){
    for(let x=startX;x<=endX;x+=2){

      const seed=hashNoise(x*4.17,y*3.91);

      const p=worldToScreen(x*TILE,y*TILE);
      const s=TILE*camera.zoom;

      for(let i=0;i<3;i++){

        const n1=hashNoise(x*17+i*31,y*13+i*19);
        const n2=hashNoise(x*29+i*11,y*23+i*7);

        const gx=p.x+n1*s;
        const gy=p.y+n2*s;

        const alpha=.035+seed*.045;

        ctx.fillStyle=`rgba(92,66,32,${alpha})`;

        ctx.beginPath();
        ctx.arc(
          gx,gy,
          Math.max(.45,.7*camera.zoom),
          0,Math.PI*2
        );
        ctx.fill();
      }
    }
  }

  const desertWidth=rightWorld;

  for(let band=0;band<13;band++){

    const baseY=
      topWorld+
      (band+.5)*(bottomWorld-topWorld)/13;

    ctx.beginPath();

    let first=true;

    for(let x=0;x<=desertWidth;x+=TILE){

      const wave=
        Math.sin(x*.0025+band*1.41)*TILE*.75+
        Math.sin(x*.0052+band*.83)*TILE*.28;

      const y=baseY+wave;
      const p=worldToScreen(x,y);

      if(first){
        ctx.moveTo(p.x,p.y);
        first=false;
      }else ctx.lineTo(p.x,p.y);
    }

    ctx.strokeStyle="rgba(118,82,34,.095)";
    ctx.lineWidth=Math.max(.7,1.25*camera.zoom);
    ctx.stroke();

    ctx.beginPath();
    first=true;

    for(let x=0;x<=desertWidth;x+=TILE){

      const wave=
        Math.sin(x*.0025+band*1.41)*TILE*.75+
        Math.sin(x*.0052+band*.83)*TILE*.28;

      const p=worldToScreen(x,baseY+wave-TILE*.45);

      if(first){
        ctx.moveTo(p.x,p.y);
        first=false;
      }else ctx.lineTo(p.x,p.y);
    }

    ctx.strokeStyle="rgba(255,237,179,.12)";
    ctx.lineWidth=Math.max(.6,.9*camera.zoom);
    ctx.stroke();
  }

  for(let i=0;i<70;i++){

    const nx=hashNoise(i*12.7,91.2);
    const ny=hashNoise(i*31.3,42.8);

    const x=nx*desertWidth;
    const y=topWorld+ny*(bottomWorld-topWorld);

    const p=worldToScreen(x,y);

    ctx.fillStyle="rgba(255,239,187,.07)";

    ctx.beginPath();
    ctx.ellipse(
      p.x,p.y,
      18*camera.zoom,
      4*camera.zoom,
      0,0,Math.PI*2
    );
    ctx.fill();
  }

  ctx.restore();
}
