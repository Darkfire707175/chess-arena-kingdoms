/* =========================================================
   PIEZAS ILUSTRADAS (estilo arcade)
   Dibuja los sprites de assets/piezas/*.png en lugar de las
   piezas vectoriales. Si una imagen no carga, se usa la
   pieza original. Solo visual: no cambia reglas ni datos.
========================================================= */
(function(){
  "use strict";
  const NAMES={king:"rey",queen:"reina",rook:"torre",bishop:"alfil",knight:"caballo",pawn:"peon"};
  const IMG={};
  for(const t in NAMES){
    const im=new Image();
    im.src="assets/piezas/"+NAMES[t]+".png";
    IMG[t]=im;
  }
  const ready=t=>{const i=IMG[t];return !!(i&&i.complete&&i.naturalWidth>0);};
  let friendlyNow=true;

  if(typeof drawPieceAura==="function"){
    const base=drawPieceAura;
    window.drawPieceAura=function(type,main,s,friendly){
      friendlyNow=friendly!==false;
      return base.apply(this,arguments);
    };
  }

  const draws={king:"drawKingPiece",queen:"drawQueenPiece",rook:"drawRookPiece",
    bishop:"drawBishopPiece",knight:"drawKnightPiece",pawn:"drawPawnPiece"};
  for(const t in draws){
    const fn=draws[t];
    if(typeof window[fn]!=="function") continue;
    const base=window[fn];
    window[fn]=function(main,metal,dark,s){
      if(!ready(t)) return base.apply(this,arguments);
      const im=IMG[t];
      ctx.save();
      if(!friendlyNow && "filter" in ctx) ctx.filter="hue-rotate(150deg) saturate(1.25) brightness(.95)";
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality="high";
      ctx.drawImage(im,-s*.7,-s*.98,s*1.4,s*1.4);
      ctx.restore();
    };
  }

  /* Si hay sprite, se omiten las capas vectoriales extra. */
  for(const fn of ["drawCharacterBackPiece","drawPieceFinishing","drawCharacterFrontPiece"]){
    if(typeof window[fn]!=="function") continue;
    const base=window[fn];
    window[fn]=function(type){
      if(ready(type)) return;
      return base.apply(this,arguments);
    };
  }
})();
