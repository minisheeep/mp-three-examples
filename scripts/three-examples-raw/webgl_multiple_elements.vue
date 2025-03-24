<template>
  <ThreeExampleLayout title="webgl_multiple_elements">
    <platform-canvas
      class="scroll-canvas"
      type="webgl2"
      canvas-id="webgl_multiple_elements"
      use-in-example
      @exampleInit="exampleInit"
    >
    </platform-canvas>
    <scroll-view scroll-y class="scroll-canvas" style="z-index: 2" @scroll="scrollHandle">
      <view
        style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap"
      >
        <view class="list-item" v-for="item in sceneList" :key="item.id">
          <view
            class="view"
            :id="item.id"
            @touchstart.capture.stop="item.eventHandler"
            @touchmove.capture.stop="item.eventHandler"
            @touchcancel.capture.stop="item.eventHandler"
            @touchend.capture.stop="item.eventHandler"
          ></view>
          <view class="title">
            {{ item.name }}
          </view>
        </view>
      </view>
    </scroll-view>
    <template v-slot:info>
      <view class="a-link" @tap="linkHandle" data-href="https://threejs.org">three.js</view>
      - multiple elements - webgl
    </template>
  </ThreeExampleLayout>
</template>

<script setup>
import * as THREE from 'three';
import { linkHandle } from '@/helpers/example-helper';
import ThreeExampleLayout from '@/components/ThreeExampleLayout.vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { hookLoaderLoadFn } from '@/helpers/analyzer';
import { getCurrentInstance, onMounted } from 'vue';
import { adapter } from '@minisheep/three-platform-adapter';
import { ref, shallowReactive } from 'vue';

//for analysis
hookLoaderLoadFn([]);

const waitForMounted = new Promise((resolve) => {
  onMounted(() => {
    resolve(true);
  });
});

const canvasStyle = ref({});
const instance = getCurrentInstance();
const sceneList = Array.from({ length: 40 })
  .fill(1)
  .map((value, index) => {
    const result = shallowReactive({
      id: `scene${index}`,
      name: `Scene ${index + 1}`,
      ready: false,
      el: null,
      readyP: null,
      eventHandler: () => {},
      recomputeSize: () => {},
      scene: null
    });
    result.readyP = adapter
      .useElement(`#${result.id}`)
      .then(({ element, eventHandler, recomputeSize }) => {
        result.ready = true;
        result.el = element;
        result.eventHandler = (event) => {
          eventHandler(event, false);
        };
        result.recomputeSize = recomputeSize;
      });

    return result;
  });

// const scrollTop = ref(0);

function scrollHandle(ev) {
  // scrollTop.value = ev.detail.scrollTop;

  sceneList.forEach((item) => {
    item.recomputeSize();
  });
}

const exampleInit = ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
  let renderer;

  init();

  function init() {
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.5, 12, 8),
      new THREE.DodecahedronGeometry(0.5),
      new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
    ];

    for (let i = 0; i < sceneList.length; i++) {
      const sceneInfo = sceneList[i];

      sceneInfo.readyP.then(() => {
        const scene = new THREE.Scene();
        // the element that represents the area we want to render the scene
        scene.userData.element = sceneInfo.el;

        const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
        camera.position.z = 2;
        scene.userData.camera = camera;

        const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
        controls.minDistance = 2;
        controls.maxDistance = 5;
        controls.enablePan = false;
        controls.enableZoom = false;
        scene.userData.controls = controls;

        // add one random mesh to each scene
        const geometry = geometries[(geometries.length * Math.random()) | 0];

        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(Math.random(), 1, 0.75, THREE.SRGBColorSpace),
          roughness: 0.5,
          metalness: 0,
          flatShading: true
        });

        scene.add(new THREE.Mesh(geometry, material));

        scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 3));

        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(1, 1, 1);
        scene.add(light);

        sceneInfo.scene = scene;
        needToDispose(scene, controls);
      });
    }

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setAnimationLoop(animate);
    needToDispose(renderer);
  }

  function updateSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
    }
  }

  function animate() {
    updateSize();

    // canvasStyle.value = {
    //   transform: `translateY(${scrollTop.value}px)`
    // };

    renderer.setClearColor(0xffffff);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xe0e0e0);
    renderer.setScissorTest(true);

    sceneList.forEach(function (info) {
      const { scene } = info;
      // so something moves
      scene.children[0].rotation.y = Date.now() * 0.001;

      // get the element that is a place holder for where we want to
      // draw the scene
      const element = scene.userData.element;

      // get its position relative to the page's viewport
      const rect = element.getBoundingClientRect();

      // check if it's offscreen. If so skip it
      if (
        rect.bottom < 0 ||
        rect.top > renderer.domElement.clientHeight ||
        rect.right < 0 ||
        rect.left > renderer.domElement.clientWidth
      ) {
        return; // it's off screen
      }

      // set the viewport
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left = rect.left;
      const bottom = renderer.domElement.clientHeight - rect.bottom;

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);

      const camera = scene.userData.camera;

      renderer.render(scene, camera);
    });
  }
};
</script>

<style scoped lang="scss">
.scroll-canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

$item-size: 25vmin;
.list-item {
  display: inline-block;
  margin: 1.5vmin;
  padding: 1.5vmin;
  box-shadow: 1px 2px 4px 0px rgba(0, 0, 0, 0.25);

  .view {
    width: $item-size;
    height: $item-size;
  }

  .title {
    color: #888;
    font-family: sans-serif;
    font-size: 12px;
    width: $item-size;
    margin-top: 10px;
  }
}
</style>
