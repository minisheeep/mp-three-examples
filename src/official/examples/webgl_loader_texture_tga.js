import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_tga',
  useLoaders: { TGALoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- TGA texture example by' }
    ],
    [{ tag: 'a', link: 'https://github.com/DaoshengMu/', content: 'Daosheng Mu' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1, 5);

      scene = new THREE.Scene();

      //

      const loader = new TGALoader();
      const geometry = new THREE.BoxGeometry();

      // add box 1 - grey8 texture

      const texture1 = loader.load('textures/crate_grey8.tga');
      texture1.colorSpace = THREE.SRGBColorSpace;
      const material1 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture1 });

      const mesh1 = new THREE.Mesh(geometry, material1);
      mesh1.position.x = -1;

      scene.add(mesh1);

      // add box 2 - tga texture

      const texture2 = loader.load('textures/crate_color8.tga');
      texture2.colorSpace = THREE.SRGBColorSpace;
      const material2 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture2 });

      const mesh2 = new THREE.Mesh(geometry, material2);
      mesh2.position.x = 1;

      scene.add(mesh2);

      //

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const light = new THREE.DirectionalLight(0xffffff, 2.5);
      light.position.set(1, 1, 1);
      scene.add(light);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;

      //

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
      stats.update();
    }
  }
};
export { exampleInfo as default };
