import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water2.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_water_flowmap',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- water flow map'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let scene, camera, renderer, water;

    init();

    function init() {
      // scene

      scene = new THREE.Scene();

      // camera

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
      camera.position.set(0, 25, 0);
      camera.lookAt(scene.position);

      // ground

      const groundGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);
      const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xe7e7e7 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = Math.PI * -0.5;
      scene.add(ground);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('textures/floors/FloorsCheckerboard_S_Diffuse.jpg', function (map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        map.repeat.set(4, 4);
        map.colorSpace = THREE.SRGBColorSpace;
        groundMaterial.map = map;
        groundMaterial.needsUpdate = true;
      });

      // water

      const waterGeometry = new THREE.PlaneGeometry(20, 20);
      const flowMap = textureLoader.load('textures/water/Water_1_M_Flow.jpg');

      water = new Water(waterGeometry, {
        scale: 2,
        textureWidth: 1024,
        textureHeight: 1024,
        flowMap: flowMap
      });

      water.position.y = 1;
      water.rotation.x = Math.PI * -0.5;
      scene.add(water);

      // flow map helper

      const helperGeometry = new THREE.PlaneGeometry(20, 20);
      const helperMaterial = new THREE.MeshBasicMaterial({ map: flowMap });
      const helper = new THREE.Mesh(helperGeometry, helperMaterial);
      helper.position.y = 1.01;
      helper.rotation.x = Math.PI * -0.5;
      helper.visible = false;
      scene.add(helper);

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setAnimationLoop(animate);
      //

      const gui = new GUI();
      gui.add(helper, 'visible').name('Show Flow Map');
      gui.open();

      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 5;
      controls.maxDistance = 50;

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(() => [renderer, scene, controls, textureLoader]);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
