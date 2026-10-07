/* =========================================================
   PIEZAS
   TODAS LAS TEXTURAS/DIBUJOS SE MANTIENEN
========================================================= */

function pieceStroke(){

  ctx.strokeStyle="#17191d";
  ctx.lineWidth=Math.max(1.5,2.1*camera.zoom);
  ctx.lineJoin="round";
  ctx.lineCap="round";
}

function metalGradient(main,metal,dark,s){

  const g=ctx.createLinearGradient(
    -s*.3,-s*.65,s*.3,s*.55
  );

  g.addColorStop(0,"#f5f6f7");
  g.addColorStop(.16,main);
  g.addColorStop(.5,metal);
  g.addColorStop(1,dark);

  return g;
}

function drawCape(main,s){

  const g=ctx.createLinearGradient(
    -s*.4,-s*.25,s*.4,s*.55
  );

  g.addColorStop(0,main);
  g.addColorStop(.55,"rgba(20,25,30,.85)");
  g.addColorStop(1,"rgba(10,13,17,.95)");

  ctx.fillStyle=g;
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.18,-s*.15);

  ctx.quadraticCurveTo(
    -s*.43,s*.08,-s*.48,s*.47
  );

  ctx.quadraticCurveTo(
    0,s*.67,s*.48,s*.47
  );

  ctx.quadraticCurveTo(
    s*.43,s*.08,s*.18,-s*.15
  );

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawArmorBody(main,metal,dark,s){

  ctx.fillStyle=metalGradient(main,metal,dark,s);
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.2,-s*.18);
  ctx.lineTo(-s*.29,s*.28);

  ctx.quadraticCurveTo(
    0,s*.42,s*.29,s*.28
  );

  ctx.lineTo(s*.2,-s*.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="rgba(20,24,28,.72)";
  ctx.fillRect(-s*.045,-s*.13,s*.09,s*.43);

  ctx.fillStyle="#d1b45d";
  ctx.beginPath();
  ctx.arc(0,s*.08,s*.055,0,Math.PI*2);
  ctx.fill();
}

function drawShoulders(main,metal,s){

  ctx.fillStyle=metalGradient(
    main,metal,"#434b53",s
  );

  pieceStroke();

  ctx.beginPath();
  ctx.ellipse(
    -s*.25,-s*.1,s*.14,s*.1,-.25,0,Math.PI*2
  );
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(
    s*.25,-s*.1,s*.14,s*.1,.25,0,Math.PI*2
  );
  ctx.fill();
  ctx.stroke();
}

function drawKingPiece(main,metal,dark,s){

  drawCape(main,s);
  drawArmorBody(main,metal,dark,s);
  drawShoulders(main,metal,s);

  ctx.fillStyle="#3e454c";
  pieceStroke();

  ctx.fillRect(-s*.1,-s*.35,s*.2,s*.16);
  ctx.strokeRect(-s*.1,-s*.35,s*.2,s*.16);

  const helmet=ctx.createLinearGradient(
    -s*.22,-s*.63,s*.2,-s*.25
  );

  helmet.addColorStop(0,"#f2f4f5");
  helmet.addColorStop(.4,metal);
  helmet.addColorStop(1,dark);

  ctx.fillStyle=helmet;
  pieceStroke();

  ctx.beginPath();
  ctx.arc(0,-s*.48,s*.2,Math.PI,Math.PI*2);
  ctx.lineTo(s*.19,-s*.32);
  ctx.lineTo(-s*.19,-s*.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#20252a";

  ctx.beginPath();
  ctx.roundRect(
    -s*.17,-s*.48,s*.34,s*.09,s*.025
  );
  ctx.fill();
  ctx.stroke();

  for(let i=-2;i<=2;i++){

    ctx.strokeStyle="rgba(220,225,228,.55)";
    ctx.lineWidth=Math.max(.6,camera.zoom);

    ctx.beginPath();
    ctx.moveTo(i*s*.055,-s*.475);
    ctx.lineTo(i*s*.055,-s*.415);
    ctx.stroke();
  }

  ctx.fillStyle="#d7b95e";
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.22,-s*.62);
  ctx.lineTo(-s*.16,-s*.79);
  ctx.lineTo(-s*.06,-s*.66);
  ctx.lineTo(0,-s*.82);
  ctx.lineTo(s*.07,-s*.66);
  ctx.lineTo(s*.18,-s*.79);
  ctx.lineTo(s*.22,-s*.61);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#e8cf78";

  ctx.fillRect(-s*.035,-s*.95,s*.07,s*.23);
  ctx.fillRect(-s*.1,-s*.88,s*.2,s*.06);
}

function drawPawnPiece(main,metal,dark,s){

  ctx.fillStyle=main;
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.16,-s*.18);
  ctx.lineTo(-s*.34,s*.38);

  ctx.quadraticCurveTo(
    0,s*.5,s*.34,s*.38
  );

  ctx.lineTo(s*.16,-s*.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=metalGradient(main,metal,dark,s);

  ctx.beginPath();
  ctx.moveTo(-s*.15,-s*.2);
  ctx.lineTo(-s*.2,s*.25);

  ctx.quadraticCurveTo(
    0,s*.35,s*.2,s*.25
  );

  ctx.lineTo(s*.15,-s*.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const hg=ctx.createRadialGradient(
    -s*.08,-s*.5,s*.03,
    0,-s*.48,s*.2
  );

  hg.addColorStop(0,"#f4f5f6");
  hg.addColorStop(.55,metal);
  hg.addColorStop(1,dark);

  ctx.fillStyle=hg;

  ctx.beginPath();
  ctx.arc(0,-s*.48,s*.19,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=metal;

  ctx.beginPath();
  ctx.arc(0,-s*.5,s*.22,Math.PI,Math.PI*2);
  ctx.lineTo(s*.18,-s*.4);
  ctx.lineTo(-s*.18,-s*.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#1c2125";

  ctx.beginPath();
  ctx.roundRect(
    -s*.17,-s*.49,s*.34,s*.07,s*.02
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=main;
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(s*.23,-s*.08);

  ctx.quadraticCurveTo(
    s*.45,-s*.02,s*.38,s*.27
  );

  ctx.quadraticCurveTo(
    s*.28,s*.39,s*.16,s*.29
  );

  ctx.lineTo(s*.12,-s*.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#d5b85e";
  ctx.beginPath();
  ctx.arc(s*.27,s*.12,s*.05,0,Math.PI*2);
  ctx.fill();
}

function drawBishopPiece(main,metal,dark,s){

  drawCape(main,s);

  ctx.fillStyle=metalGradient(main,metal,dark,s);
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.25,-s*.25);
  ctx.lineTo(-s*.37,s*.4);

  ctx.quadraticCurveTo(
    0,s*.53,s*.37,s*.4
  );

  ctx.lineTo(s*.25,-s*.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=main;

  ctx.beginPath();
  ctx.moveTo(-s*.12,-s*.25);
  ctx.lineTo(0,s*.31);
  ctx.lineTo(s*.12,-s*.25);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle=metalGradient(main,metal,dark,s);

  ctx.beginPath();
  ctx.arc(0,-s*.47,s*.17,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=main;

  ctx.beginPath();
  ctx.moveTo(-s*.2,-s*.57);
  ctx.lineTo(0,-s*.84);
  ctx.lineTo(s*.2,-s*.57);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle="#1a1e21";
  ctx.lineWidth=Math.max(2,3*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(-s*.035,-s*.73);
  ctx.lineTo(s*.07,-s*.59);
  ctx.stroke();

  ctx.strokeStyle="#9e7c45";
  ctx.lineWidth=Math.max(1.5,3*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(s*.25,-s*.38);
  ctx.lineTo(s*.3,s*.43);
  ctx.stroke();

  ctx.fillStyle="#d7ba62";
  ctx.beginPath();
  ctx.arc(s*.25,-s*.42,s*.07,0,Math.PI*2);
  ctx.fill();
}

function drawKnightPiece(main,metal,dark,s){

  const g=ctx.createLinearGradient(
    -s*.3,-s*.55,s*.35,s*.5
  );

  g.addColorStop(0,"#f3f4f5");
  g.addColorStop(.35,metal);
  g.addColorStop(.75,main);
  g.addColorStop(1,dark);

  ctx.fillStyle=g;
  pieceStroke();

  ctx.beginPath();

  ctx.moveTo(-s*.28,s*.42);
  ctx.lineTo(-s*.18,-s*.2);
  ctx.lineTo(-s*.1,-s*.48);
  ctx.lineTo(-s*.18,-s*.68);
  ctx.lineTo(s*.02,-s*.9);
  ctx.lineTo(s*.16,-s*.73);
  ctx.lineTo(s*.35,-s*.55);
  ctx.lineTo(s*.31,-s*.32);
  ctx.lineTo(s*.18,-s*.2);
  ctx.lineTo(s*.27,s*.42);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=metal;

  ctx.beginPath();
  ctx.moveTo(-s*.08,-s*.72);
  ctx.lineTo(-s*.19,-s*.99);
  ctx.lineTo(s*.01,-s*.83);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=dark;

  ctx.beginPath();
  ctx.moveTo(-s*.2,-s*.48);

  for(let i=0;i<5;i++){
    ctx.lineTo(
      -s*.35-i*s*.015,
      -s*.35+i*s*.16
    );
    ctx.lineTo(
      -s*.2,
      -s*.24+i*s*.1
    );
  }

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle=metal;

  ctx.beginPath();
  ctx.moveTo(s*.05,-s*.65);

  ctx.quadraticCurveTo(
    s*.38,-s*.67,s*.43,-s*.51
  );

  ctx.quadraticCurveTo(
    s*.33,-s*.4,s*.13,-s*.43
  );

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#d8ba57";

  ctx.beginPath();
  ctx.arc(s*.17,-s*.61,s*.045,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle=main;
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.18,-s*.12);
  ctx.lineTo(-s*.3,s*.38);

  ctx.quadraticCurveTo(
    0,s*.5,s*.3,s*.38
  );

  ctx.lineTo(s*.18,-s*.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle="#24282d";
  ctx.lineWidth=Math.max(1,2*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(s*.02,-s*.7);
  ctx.lineTo(s*.38,-s*.52);
  ctx.stroke();
}

function drawRookPiece(main,metal,dark,s){

  ctx.fillStyle=metalGradient(main,metal,dark,s);
  pieceStroke();

  ctx.beginPath();
  ctx.roundRect(
    -s*.31,s*.2,s*.62,s*.28,s*.04
  );
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-s*.25,-s*.43);
  ctx.lineTo(-s*.3,s*.25);
  ctx.lineTo(s*.3,s*.25);
  ctx.lineTo(s*.25,-s*.43);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=metal;

  const bw=s*.12;

  for(let i=-2;i<=2;i++){

    ctx.fillRect(
      i*s*.12-bw/2,
      -s*.63,
      bw,s*.22
    );

    ctx.strokeRect(
      i*s*.12-bw/2,
      -s*.63,
      bw,s*.22
    );
  }

  ctx.fillStyle="#20252a";

  ctx.beginPath();
  ctx.roundRect(
    -s*.11,-s*.1,s*.22,s*.35,s*.03
  );
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle="rgba(255,255,255,.18)";
  ctx.lineWidth=Math.max(.7,camera.zoom);

  ctx.beginPath();
  ctx.moveTo(-s*.21,-s*.25);
  ctx.lineTo(s*.21,-s*.25);
  ctx.moveTo(-s*.22,s*.08);
  ctx.lineTo(s*.22,s*.08);
  ctx.stroke();

  ctx.strokeStyle="#34291e";
  ctx.lineWidth=Math.max(1.5,2*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(s*.28,-s*.68);
  ctx.lineTo(s*.28,-s*.95);
  ctx.stroke();

  ctx.fillStyle=main;

  ctx.beginPath();
  ctx.moveTo(s*.29,-s*.94);
  ctx.lineTo(s*.53,-s*.87);
  ctx.lineTo(s*.29,-s*.77);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawQueenPiece(main,metal,dark,s){

  drawCape(main,s);

  ctx.fillStyle=metalGradient(main,metal,dark,s);
  pieceStroke();

  ctx.beginPath();
  ctx.moveTo(-s*.16,-s*.25);
  ctx.lineTo(-s*.38,s*.4);

  ctx.quadraticCurveTo(
    0,s*.56,s*.38,s*.4
  );

  ctx.lineTo(s*.16,-s*.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle=main;

  ctx.beginPath();
  ctx.moveTo(-s*.16,-s*.31);
  ctx.lineTo(-s*.12,s*.12);

  ctx.quadraticCurveTo(
    0,s*.2,s*.12,s*.12
  );

  ctx.lineTo(s*.16,-s*.31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const hg=ctx.createRadialGradient(
    -s*.07,-s*.48,s*.03,
    0,-s*.45,s*.22
  );

  hg.addColorStop(0,"#f5f6f6");
  hg.addColorStop(.5,metal);
  hg.addColorStop(1,dark);

  ctx.fillStyle=hg;

  ctx.beginPath();
  ctx.arc(0,-s*.48,s*.17,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#d9bd60";

  ctx.beginPath();
  ctx.moveTo(-s*.23,-s*.61);
  ctx.lineTo(-s*.2,-s*.8);
  ctx.lineTo(-s*.07,-s*.67);
  ctx.lineTo(0,-s*.86);
  ctx.lineTo(s*.08,-s*.67);
  ctx.lineTo(s*.21,-s*.8);
  ctx.lineTo(s*.23,-s*.61);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#e4c55c";

  ctx.beginPath();
  ctx.arc(0,-s*.73,s*.045,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="#a78345";
  ctx.lineWidth=Math.max(1.5,2*camera.zoom);

  ctx.beginPath();
  ctx.moveTo(s*.25,-s*.2);
  ctx.lineTo(s*.32,s*.4);
  ctx.stroke();

  ctx.fillStyle="#d9bd60";

  ctx.beginPath();
  ctx.arc(s*.24,-s*.27,s*.08,0,Math.PI*2);
  ctx.fill();
}


/* =========================================================
   ACABADO VISUAL DE UNIDADES
   Detalles extra sin sustituir los diseños base.
========================================================= */

function drawPieceAura(type,main,s,friendly){

  const pulse=
    .88+
    Math.sin(performance.now()/520)*.12;

  ctx.save();

  ctx.globalAlpha=
    (friendly?.11:.075)*pulse;

  ctx.shadowColor=main;
  ctx.shadowBlur=s*.22;

  ctx.strokeStyle=main;
  ctx.lineWidth=Math.max(
    1,
    camera.zoom*1.25
  );

  ctx.beginPath();

  if(type==="king"||type==="queen"){
    ctx.arc(
      0,s*.33,
      s*.34,
      Math.PI*.12,
      Math.PI*.88
    );
  }else{
    ctx.ellipse(
      0,s*.35,
      s*.29,s*.09,
      0,0,Math.PI*2
    );
  }

  ctx.stroke();

  ctx.globalAlpha=
    (friendly?.045:.03)*pulse;

  const g=ctx.createRadialGradient(
    0,s*.18,s*.02,
    0,s*.18,s*.56
  );

  g.addColorStop(0,main);
  g.addColorStop(1,"rgba(0,0,0,0)");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.ellipse(
    0,s*.18,
    s*.42,s*.5,
    0,0,Math.PI*2
  );
  ctx.fill();

  ctx.restore();
}

function drawPieceFinishing(type,main,metal,dark,s,friendly){

  ctx.save();
  ctx.lineJoin="round";
  ctx.lineCap="round";

  const gold=
    friendly
    ?" #ead078".trim()
    :"#d4a957";

  /*
    REY — emblema de mando y joyas de corona.
  */
  if(type==="king"){

    ctx.fillStyle=gold;

    for(const [x,y,r] of [
      [-s*.12,-s*.735,s*.035],
      [0,-s*.775,s*.042],
      [s*.12,-s*.735,s*.035]
    ]){
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }

    ctx.strokeStyle="rgba(255,255,255,.28)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-s*.17,-s*.29);
    ctx.lineTo(-s*.08,-s*.22);
    ctx.moveTo(s*.17,-s*.29);
    ctx.lineTo(s*.08,-s*.22);
    ctx.stroke();
  }

  /*
    REINA — diadema de piedras y medallón central.
  */
  if(type==="queen"){

    for(const [x,y,r,a] of [
      [-s*.14,-s*.70,s*.028,0],
      [0,-s*.78,s*.035,0],
      [s*.14,-s*.70,s*.028,0]
    ]){
      ctx.globalAlpha=.96;
      ctx.fillStyle=
        a===1
        ?"rgba(235,245,255,.95)"
        :gold;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle=gold;
    ctx.beginPath();
    ctx.arc(0,s*.02,s*.045,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="rgba(255,255,255,.22)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-s*.2,-s*.25);
    ctx.lineTo(-s*.08,-s*.15);
    ctx.moveTo(s*.2,-s*.25);
    ctx.lineTo(s*.08,-s*.15);
    ctx.stroke();
  }

  /*
    ALFIL — foco del báculo y marca diagonal.
  */
  if(type==="bishop"){

    ctx.shadowColor=gold;
    ctx.shadowBlur=s*.08;
    ctx.fillStyle=gold;

    ctx.beginPath();
    ctx.arc(s*.25,-s*.42,s*.095,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(255,255,255,.25)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-s*.14,-s*.05);
    ctx.lineTo(s*.12,s*.20);
    ctx.stroke();
  }

  /*
    CABALLO — visor más definido y cresta.
  */
  if(type==="knight"){

    ctx.fillStyle="#171b20";

    ctx.beginPath();
    ctx.roundRect(
      s*.08,-s*.64,
      s*.18,s*.045,
      s*.018
    );
    ctx.fill();

    ctx.fillStyle=gold;

    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(
        -s*.04+i*s*.05,
        -s*.86+i*s*.035
      );
      ctx.lineTo(
        -s*.12+i*s*.06,
        -s*(.98-i*.03)
      );
      ctx.lineTo(
        s*.01+i*s*.045,
        -s*.86+i*s*.035
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle="rgba(255,255,255,.2)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    ctx.beginPath();
    ctx.moveTo(-s*.14,-s*.18);
    ctx.lineTo(s*.12,-s*.05);
    ctx.stroke();
  }

  /*
    TORRE — núcleo de defensa y placas reforzadas.
  */
  if(type==="rook"){

    ctx.fillStyle=gold;

    ctx.beginPath();
    ctx.arc(0,s*.05,s*.055,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="rgba(255,255,255,.22)";
    ctx.lineWidth=Math.max(1,camera.zoom);

    for(const y of [-.2,.02,.23]){
      ctx.beginPath();
      ctx.moveTo(-s*.18,s*y);
      ctx.lineTo(s*.18,s*y);
      ctx.stroke();
    }
  }

  /*
    PEÓN — pequeño escudo y remate de explorador.
  */
  if(type==="pawn"){

    ctx.strokeStyle=gold;
    ctx.lineWidth=Math.max(1,camera.zoom*1.1);

    ctx.beginPath();
    ctx.moveTo(0,s*.02);
    ctx.lineTo(-s*.09,s*.11);
    ctx.lineTo(0,s*.23);
    ctx.lineTo(s*.09,s*.11);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle=gold;
    ctx.beginPath();
    ctx.arc(0,-s*.70,s*.028,0,Math.PI*2);
    ctx.fill();
  }

  /*
    Brillo común de la silueta superior.
  */
  ctx.strokeStyle="rgba(255,255,255,.14)";
  ctx.lineWidth=Math.max(.7,camera.zoom*.8);

  ctx.beginPath();
  ctx.arc(
    0,-s*.36,
    s*.12,
    Math.PI*1.08,
    Math.PI*1.82
  );
  ctx.stroke();

  ctx.restore();
}
