/* 18-ambient-life.js — vida ambiental arcade (solo visual) */
(function(){
  if(typeof drawAnimatedBiomeParticles!=="function")return;
  var base=drawAnimatedBiomeParticles;
  var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)");
  var fish=[],weeds=[],liz=[],bub=[],leaves=[],flies=[];
  var T={fish:1500,weed:2500,liz:3000,bub:600,leaf:400,fly:500},last=performance.now();
  function rnd(a,b){return a+Math.random()*(b-a);}
  function tiles(type,l,r,t,b){var o=[];for(var y=Math.max(0,t|0);y<Math.min(MAP_H,b+1);y++)for(var x=Math.max(0,l|0);x<Math.min(MAP_W,r+1);x++)if(terrain[y]&&terrain[y][x]===type)o.push([x,y]);return o;}
  function forest(l,r,t,b){var o=[];for(var y=Math.max(0,t|0);y<Math.min(MAP_H,b+1);y++){var row=terrainDecor[y]||[];for(var i=0;i<row.length;i++){var d=row[i];if(d.x>=l&&d.x<=r&&(d.type==="tree"||d.type==="bush"))o.push([d.x,d.y]);}}return o;}
  function pick(a){return a[(Math.random()*a.length)|0];}
  function scr(wx,wy){return worldToScreen(wx,wy);}
  function nearUnit(wx,wy){try{if(typeof units==="undefined"||!units)return false;for(var i=0;i<units.length;i++){var u=units[i];if(Math.hypot((u.x+.5)*TILE-wx,(u.y+.5)*TILE-wy)<TILE*2.5)return true;}}catch(e){}return false;}
  function isT(wx,wy,type){var x=Math.floor(wx/TILE),y=Math.floor(wy/TILE);return terrain[y]&&terrain[y][x]===type;}

  function spawn(dt,l,r,t,b){
    for(var k in T)T[k]-=dt;
    var z;
    if(T.fish<=0){T.fish=rnd(2200,6200);if(fish.length<4&&(z=tiles("water",l,r,t,b)).length){var p=pick(z);fish.push({x:(p[0]+.5)*TILE,y:(p[1]+.5)*TILE,dir:Math.random()<.5?-1:1,t:0,d:1.1,c:pick(["#ffa23a","#7fd3ff","#ffd55a"])});}}
    if(T.weed<=0){T.weed=rnd(4000,9000);if(weeds.length<3&&(z=tiles("sand",l,r,t,b)).length){var q=pick(z);weeds.push({x:(q[0]+.5)*TILE,y:(q[1]+.5)*TILE,vx:rnd(28,46),rot:0,t:0});}}
    if(T.liz<=0){T.liz=rnd(3000,7000);if(liz.length<3&&(z=tiles("sand",l,r,t,b)).length){var s=pick(z);liz.push({x:(s[0]+.5)*TILE,y:(s[1]+.5)*TILE,a:rnd(0,6.28),st:"run",t:0,run:rnd(.5,1),life:1,n:0});}}
    if(T.bub<=0){T.bub=rnd(500,1400);if(bub.length<8&&(z=tiles("lava",l,r,t,b)).length){var v=pick(z);bub.push({x:(v[0]+rnd(.2,.8))*TILE,y:(v[1]+rnd(.2,.8))*TILE,t:0,d:rnd(1,1.8),sp:null});}}
    if(T.leaf<=0){T.leaf=400;if(leaves.length<14&&(z=forest(l,r,t,b)).length){var f=pick(z);leaves.push({x:(f[0]+.5)*TILE,y:(f[1]+.1)*TILE,t:0,d:rnd(3,5),ph:rnd(0,6),c:Math.random()<.35?pick(["#e08a2c","#d4562a","#f2c14e"]):pick(["#6fbf4a","#4f9c3a"])});}}
    if(T.fly<=0){T.fly=500;if(flies.length<10&&(z=forest(l,r,t,b)).length){var g=pick(z);flies.push({x:(g[0]+rnd(-.5,1.5))*TILE,y:(g[1]+rnd(-.5,1.5))*TILE,t:0,d:rnd(3,6),ph:rnd(0,6)});}}
  }

  function draw(dt){
    var Z=camera.zoom,s=dt/1000,i,p;
    ctx.save();
    for(i=fish.length-1;i>=0;i--){var F=fish[i];F.t+=s;var k=F.t/F.d;if(k>1.6){fish.splice(i,1);continue;}
      if(k<=1){var wx=F.x+F.dir*(k-.5)*TILE*.9,h=Math.sin(k*Math.PI)*TILE*.7;p=scr(wx,F.y-h);var ang=Math.atan2(-Math.cos(k*Math.PI),.6)*F.dir;
        var sh=scr(wx,F.y);ctx.globalAlpha=.25;ctx.fillStyle="#032";ctx.beginPath();ctx.ellipse(sh.x,sh.y,5*Z,2*Z,0,0,7);ctx.fill();
        ctx.globalAlpha=1;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(ang);ctx.scale(F.dir,1);ctx.fillStyle=F.c;ctx.beginPath();ctx.ellipse(0,0,6*Z,2.6*Z,0,0,7);ctx.fill();
        ctx.fillStyle="#ff7a1a";ctx.beginPath();ctx.moveTo(-5*Z,0);ctx.lineTo(-9*Z,-3*Z);ctx.lineTo(-9*Z,3*Z);ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(3*Z,-1*Z,1.2*Z,1.2*Z);ctx.restore();}
      [0,1].forEach(function(e){var kk=k-e,cx=F.x+F.dir*(e?.45:-.45)*TILE*.9;if(kk>=-.0&&kk<.6&&(e?k>=1:k>=0)){var q=scr(cx,F.y),rr=(e?k-1:k)*30*Z+2*Z;ctx.globalAlpha=Math.max(0,.7-(e?k-1:k));ctx.strokeStyle="#dff6ff";ctx.lineWidth=1.3*Z;ctx.beginPath();ctx.ellipse(q.x,q.y,rr,rr*.45,0,0,7);ctx.stroke();}});
    }
    for(i=weeds.length-1;i>=0;i--){var W2=weeds[i];W2.t+=s;W2.x+=W2.vx*s;W2.rot+=W2.vx*s/7;if(W2.t>16||!isT(W2.x,W2.y,"sand")){weeds.splice(i,1);continue;}
      var bo=Math.abs(Math.sin(W2.t*4))*TILE*.25;p=scr(W2.x,W2.y-bo);var g=scr(W2.x,W2.y);ctx.globalAlpha=.25;ctx.fillStyle="#5a3a10";ctx.beginPath();ctx.ellipse(g.x,g.y+5*Z,6*Z,2*Z,0,0,7);ctx.fill();
      ctx.globalAlpha=1;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(W2.rot);ctx.strokeStyle="#a9783a";ctx.lineWidth=1.2*Z;for(var j=0;j<7;j++){ctx.beginPath();ctx.arc(0,0,(3+j%3*2)*Z,j,j+2.4);ctx.stroke();}ctx.restore();}
    for(i=liz.length-1;i>=0;i--){var L=liz[i];L.t+=s;
      if(nearUnit(L.x,L.y))L.st="hide";
      if(L.st==="hide"){L.life-=s/.35;if(L.life<=0){liz.splice(i,1);continue;}}
      else if(L.st==="run"){var nx=L.x+Math.cos(L.a)*TILE*3.5*s,ny=L.y+Math.sin(L.a)*TILE*3.5*s;if(isT(nx,ny,"sand")){L.x=nx;L.y=ny;}else L.a+=Math.PI*.7;if(L.t>L.run){L.st="pause";L.t=0;L.n++;}}
      else if(L.t>rnd(.6,1.2)){if(L.n>3){L.st="hide";}else{L.st="run";L.t=0;L.a+=rnd(-1.4,1.4);}}
      p=scr(L.x,L.y);ctx.globalAlpha=Math.max(0,L.life);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(L.a);ctx.fillStyle="#b9862f";ctx.beginPath();ctx.ellipse(0,0,4.5*Z,1.6*Z,0,0,7);ctx.fill();
      ctx.beginPath();ctx.moveTo(-4*Z,0);ctx.lineTo(-10*Z,Math.sin(L.t*30)*Z);ctx.lineWidth=1.2*Z;ctx.strokeStyle="#9a6d24";ctx.stroke();
      var w=L.st==="run"?Math.sin(L.t*40)*1.5*Z:0;ctx.fillRect(1*Z,-3*Z+w,1*Z,6*Z-2*w);ctx.fillRect(-2*Z,-3*Z-w,1*Z,6*Z+2*w);ctx.restore();}
    for(i=bub.length-1;i>=0;i--){var B=bub[i];B.t+=s;p=scr(B.x,B.y);
      if(B.t<B.d){var r=B.t/B.d*5*Z+1;ctx.globalAlpha=.9;ctx.fillStyle="#ff8a2a";ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.fillStyle="#ffe67a";ctx.beginPath();ctx.arc(p.x-r*.3,p.y-r*.3,r*.35,0,7);ctx.fill();}
      else{if(!B.sp){B.sp=[];for(var m=0;m<7;m++)B.sp.push({a:m/7*6.28+rnd(-.3,.3),v:rnd(10,22)});}var e2=B.t-B.d;if(e2>.6){bub.splice(i,1);continue;}
        ctx.fillStyle="#ffd25a";B.sp.forEach(function(S){ctx.globalAlpha=1-e2/.6;ctx.fillRect(p.x+Math.cos(S.a)*S.v*e2*Z*2,p.y+Math.sin(S.a)*S.v*e2*Z*2-e2*10*Z,1.6*Z,1.6*Z);});}}
    for(i=leaves.length-1;i>=0;i--){var Lf=leaves[i];Lf.t+=s;if(Lf.t>Lf.d){leaves.splice(i,1);continue;}p=scr(Lf.x+Math.sin(Lf.t*2+Lf.ph)*TILE*.4,Lf.y+Lf.t*TILE*.35);
      ctx.globalAlpha=Math.min(1,(Lf.d-Lf.t));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(Lf.t*3+Lf.ph));ctx.fillStyle=Lf.c;ctx.beginPath();ctx.ellipse(0,0,2.6*Z,1.3*Z,0,0,7);ctx.fill();ctx.restore();}
    for(i=flies.length-1;i>=0;i--){var Fl=flies[i];Fl.t+=s;if(Fl.t>Fl.d){flies.splice(i,1);continue;}p=scr(Fl.x+Math.sin(Fl.t+Fl.ph)*TILE*.3,Fl.y+Math.cos(Fl.t*.8+Fl.ph)*TILE*.2);
      var a=Math.max(0,Math.sin(Fl.t*3+Fl.ph))*Math.sin(Fl.t/Fl.d*Math.PI);var gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,5*Z);gr.addColorStop(0,"rgba(240,255,140,"+a+")");gr.addColorStop(1,"rgba(240,255,140,0)");ctx.globalAlpha=1;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,5*Z,0,7);ctx.fill();}
    ctx.restore();
  }

  window.drawAnimatedBiomeParticles=drawAnimatedBiomeParticles=function(l,r,t,b){
    base(l,r,t,b);
    if(rm&&rm.matches)return;
    var now=performance.now(),dt=Math.min(100,now-last);last=now;
    try{spawn(dt,l,r,t,b);draw(dt);}catch(e){}
  };
})();
