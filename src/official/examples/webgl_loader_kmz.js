import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_kmz',
  useLoaders: [KMZLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [
      {
        tag: 'a',
        link: 'https://developers.google.com/kml/documentation/kmzarchives',
        content: 'KMZLoader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init();

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x999999);

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0.5, 1.0, 0.5).normalize();

      scene.add(light);

      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500);

      camera.position.y = 5;
      camera.position.z = 10;

      scene.add(camera);

      const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x7b7b7b);
      scene.add(grid);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const loader = new KMZLoader();
      loader.load('./models/kmz/Box.kmz', function (kmz) {
        kmz.scene.position.y = 0.5;
        scene.add(kmz.scene);
        render();
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader, controls);
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
