"use strict";

(() => {
  const screen=document.getElementById("startScreen");
  const layers=[
    document.querySelector(".startSceneLayerA"),
    document.querySelector(".startSceneLayerB")
  ];
  if(!screen||layers.some(layer=>!layer))return;

  const scenes=["forest","desert","volcanic","ice","shadows","void"];
  let currentIndex=Math.floor(Math.random()*scenes.length);
  let activeLayer=0;

  const applyScene=(layer,scene)=>{
    layer.dataset.scene=scene;
    layer.classList.add("active");
  };

  applyScene(layers[0],scenes[currentIndex]);
  layers[1].classList.remove("active");

  window.setInterval(()=>{
    let nextIndex=Math.floor(Math.random()*scenes.length);
    while(scenes.length>1&&nextIndex===currentIndex){
      nextIndex=Math.floor(Math.random()*scenes.length);
    }
    currentIndex=nextIndex;
    activeLayer=activeLayer===0?1:0;
    const nextLayer=layers[activeLayer];
    const oldLayer=layers[activeLayer===0?1:0];
    applyScene(nextLayer,scenes[currentIndex]);
    oldLayer.classList.remove("active");
  },15000);
})();
