<template>
  <ThreeExampleLayout title="webgl_materials_texture_canvas">
    <platform-canvas
      type="webgl2"
      canvas-id="webgl_materials_texture_canvas"
      use-in-example
      @exampleInit="exampleInit"
    >
    </platform-canvas>
    <platform-canvas
      type="2d"
      class="drawing-canvas"
      canvas-id="webgl_materials_texture_drawing_canvas"
      use-in-example
      @exampleInit="exampleInit2"
    ></platform-canvas>
    <template v-slot:info>
      <view class="a-link" @tap="linkHandle" data-href="https://threejs.org">three.js</view>
      - webgl - canvas as a texture
      <view>click and draw in the white box</view>
    </template>
  </ThreeExampleLayout>
</template>

<script setup>
import { ref } from 'vue';
import * as THREE from 'three';
import { linkHandle } from '@/helpers/example-helper';
import ThreeExampleLayout from '@/components/ThreeExampleLayout.vue';

import { hookLoaderLoadFn } from '@/helpers/analyzer';

//for analysis
hookLoaderLoadFn([]);

let camera, scene, renderer, mesh, material;
const drawStartPos = new THREE.Vector2();

let resolveFn;
const waitForP = new Promise((resolve) => {
  resolveFn = resolve;
});
const drawFn = ref();

const exampleInit = ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
  init();
  resolveFn();
  drawFn.value = draw;

  function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 500;

    scene = new THREE.Scene();

    material = new THREE.MeshBasicMaterial();

    mesh = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    window.addEventListener('resize', onWindowResize);
    needToDispose(renderer, scene);
  }

  // Sets up the drawing canvas and adds it as the material map

  function draw(drawContext, x, y) {
    drawContext.moveTo(drawStartPos.x, drawStartPos.y);
    drawContext.strokeStyle = '#000000';
    drawContext.lineTo(x, y);
    drawContext.stroke();
    // reset drawing start position to current position.
    drawStartPos.set(x, y);
    // need to flag the map as needing updating.
    material.map.needsUpdate = true;
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    renderer.render(scene, camera);
  }
};

const exampleInit2 = ({ canvas: drawingCanvas }) => {
  // get canvas and context
  drawingCanvas.width = 128;
  drawingCanvas.height = 128;
  const drawingContext = drawingCanvas.getContext('2d');

  // draw white background

  drawingContext.fillStyle = '#FFFFFF';
  drawingContext.fillRect(0, 0, 128, 128);

  // set canvas as material.map (this could be done to any map, bump, displacement etc.)

  waitForP.then(() => {
    material.map = new THREE.CanvasTexture(drawingCanvas);
  });

  // set the variable to keep track of when to draw

  let paint = false;

  // add canvas event listeners
  drawingCanvas.addEventListener('pointerdown', function (e) {
    paint = true;
    drawStartPos.set(e.offsetX, e.offsetY);
  });

  drawingCanvas.addEventListener('pointermove', function (e) {
    console.log('123213213', e);
    if (paint) drawFn.value?.(drawingContext, e.offsetX, e.offsetY);
  });

  drawingCanvas.addEventListener('pointerup', function () {
    paint = false;
  });

  drawingCanvas.addEventListener('pointerleave', function () {
    paint = false;
  });
};
</script>
<style scoped lang="scss">
.drawing-canvas {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 33vmin !important;
  height: 33vmin !important;
  pointer-events: all;
}
</style>
