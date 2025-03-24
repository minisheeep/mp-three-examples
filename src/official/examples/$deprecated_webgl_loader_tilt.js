import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TiltLoader } from 'three/examples/jsm/loaders/TiltLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_tilt',
  useLoaders: [TiltLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- tilt loader' }
    ],
    [
      { tag: 'a', link: 'https://poly.google.com/view/ewUb8s99x_k', content: 'TILTSPHERE' },
      { tag: 'text', content: 'by' },
      { tag: 'a', link: 'https://poly.google.com/user/8CZPjCt8LvV', content: 'Rosie Summers' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init();

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500);

      camera.position.y = 43;
      camera.position.z = 100;

      scene.add(camera);

      const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x555555);
      scene.add(grid);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const loader = new TiltLoader();
      loader.load('./models/tilt/BRUSH_DOME.tilt', function (object) {
        // console.log( object.children.length );
        scene.add(object);
        render();
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.target.y = camera.position.y;
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
