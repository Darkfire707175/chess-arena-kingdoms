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
