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
