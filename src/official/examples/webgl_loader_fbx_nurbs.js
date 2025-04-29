import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_fbx_nurbs',
  useLoaders: { FBXLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- FBXLoader - Nurbs'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.set(2, 18, 28);

      scene = new THREE.Scene();

      // grid
      const gridHelper = new THREE.GridHelper(28, 28, 0x303030, 0x303030);
      scene.add(gridHelper);

      // stats
      stats = new Stats(renderer);

      // model
      const loader = new FBXLoader();
      loader.load('models/fbx/nurbs.fbx', function (object) {
        scene.add(object);
      });

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 12, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
