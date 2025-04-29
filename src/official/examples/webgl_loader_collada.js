import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_collada',
  useLoaders: { ColladaLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'collada loader'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Elf Girl by'
      },
      {
        tag: 'a',
        link: 'https://sketchfab.com/yellow09',
        content: 'halloween'
      },
      {
        tag: 'text',
        content: ','
      },
      {
        tag: 'a',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        content: 'CC Attribution'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, clock;
    let camera, scene, renderer, elf;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.set(8, 10, 8);
      camera.lookAt(0, 3, 0);

      scene = new THREE.Scene();

      clock = new THREE.Clock();

      // collada

      const loader = new ColladaLoader();
      loader.load('./models/collada/elf/elf.dae', function (collada) {
        elf = collada.scene;
        scene.add(elf);
      });

      //

      const ambientLight = new THREE.AmbientLight(0xffffff);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      directionalLight.position.set(1, 1, 0).normalize();
      scene.add(directionalLight);

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      const delta = clock.getDelta();

      if (elf !== undefined) {
        elf.rotation.z += delta * 0.5;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
