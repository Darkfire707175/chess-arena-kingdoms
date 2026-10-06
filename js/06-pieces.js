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
