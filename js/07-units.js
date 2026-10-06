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
