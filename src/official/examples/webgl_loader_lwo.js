import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LWOLoader } from 'three/examples/jsm/loaders/LWOLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_lwo',
  useLoaders: { LWOLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- LWOLoader'
      }
    ],
    []
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200);
      camera.position.set(0.7, 14.6, -43.2);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xa0a0a0);

      const ambientLight = new THREE.AmbientLight(0xbbbbbb);
      scene.add(ambientLight);

      const light1 = new THREE.DirectionalLight(0xc1c1c1, 3);
      light1.position.set(0, 200, -100);
      scene.add(light1);

      const grid = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
      grid.material.opacity = 0.3;
      grid.material.transparent = true;
      scene.add(grid);

      const loader = new LWOLoader();
      loader.load('models/lwo/Objects/LWO3/Demo.lwo', function (object) {
        const phong = object.meshes[0];
        phong.position.set(2, 12, 0);

        const standard = object.meshes[1];
        standard.position.set(-2, 12, 0);

        const rocket = object.meshes[2];
        rocket.position.set(0, 10.5, 1);

        scene.add(phong, standard, rocket);
      });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(-1.33, 10, 6.7);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader, controls);
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
