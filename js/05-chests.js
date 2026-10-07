/* =========================================================
   COFRES
   Se añaden sin modificar las texturas existentes.
========================================================= */

function chestCellFree(x,y){
  if(!validCell(x,y))return false;
  if(chests.some(c=>c.x===x&&c.y===y&&!c.collected))return false;
  if(units.some(u=>u.alive&&u.x===x&&u.y===y))return false;
  return true;
}

function generateChests(){
  chests=[];
  const wanted=30;
  let attempts=0;
  while(chests.length<wanted&&attempts<12000){
    attempts++;
    const x=Math.floor(Math.random()*MAP_W);
    const y=Math.floor(Math.random()*MAP_H);
    if(!chestCellFree(x,y))continue;
    chests.push({
      x,y,
      reward:15+Math.floor(Math.random()*36),
      diamonds:(()=>{const r=Math.random();return r<.45?3:r<.70?4:r<.87?5:r<.96?6:7;})(),
      collected:false
    });
  }
}

function drawChest(c){
  if(!c||c.collected)return;
  if(!isVisible(c.x,c.y))return;

  const p=worldToScreen(c.x*TILE+TILE/2,c.y*TILE+TILE/2);
  const s=TILE*camera.zoom;
  if(p.x+s<0||p.y+s<0||p.x-s>W||p.y-s>H)return;

  ctx.save();
  ctx.translate(p.x,p.y);

  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(0,s*.25,s*.30,s*.10,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#7b4d25";
  ctx.strokeStyle="#2d2118";
  ctx.lineWidth=Math.max(1.5,2*camera.zoom);
  ctx.beginPath();
  ctx.roundRect(-s*.25,-s*.04,s*.50,s*.31,s*.035);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#a66b32";
  ctx.beginPath();
  ctx.arc(0,-s*.03,s*.25,Math.PI,Math.PI*2);
  ctx.lineTo(s*.25,s*.03);
  ctx.lineTo(-s*.25,s*.03);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#e1bd55";
  ctx.fillRect(-s*.045,-s*.035,s*.09,s*.15);
  ctx.strokeRect(-s*.045,-s*.035,s*.09,s*.15);
  ctx.restore();
}

function collectChestAt(x,y,u){
  const chest=chests.find(c=>!c.collected&&c.x===x&&c.y===y);
  if(!chest)return;

  chest.collected=true;
  playerArmy.coins+=chest.reward;
  const diamondReward=Math.max(0,Number(chest.diamonds)||0);
  globalDiamonds=Math.max(0,Number(globalDiamonds)||0)+diamondReward;

  for(let i=0;i<18;i++){
    particles.push({
      x:x*TILE+TILE/2+rand(-TILE*.22,TILE*.22),
      y:y*TILE+TILE/2+rand(-TILE*.18,TILE*.18),
      life:.7,
      max:.7,
      chest:true,
      vx:rand(-35,35),
      vy:rand(-75,-20)
    });
  }

  floatingTexts.push({
    x,y,
    text:`+${chest.reward} 🪙${diamondReward?` +${diamondReward} 💎`:``}`,
    life:1.4
  });

  showMessage(`🎁 ¡Has cogido el cofre! +${chest.reward} 🪙${diamondReward?` +${diamondReward} 💎`:``}`);
  saveProgress();
  updateUI();
}
