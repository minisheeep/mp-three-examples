import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VOXLoader, VOXMesh } from 'three/examples/jsm/loaders/VOXLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_vox',
  useLoaders: [VOXLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- vox loader (' }
    ],
    [
      { tag: 'a', link: 'https://ephtracy.github.io/', content: 'Magica Voxel' },
      { tag: 'text', content: ')' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose }) => {
    let camera, controls, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10);
      camera.position.set(0.175, 0.075, 0.175);

      scene = new THREE.Scene();
      scene.add(camera);

      // light

      const hemiLight = new THREE.HemisphereLight(0xcccccc, 0x444444, 3);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
      dirLight.position.set(1.5, 3, 2.5);
      scene.add(dirLight);

      const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight2.position.set(-1.5, -3, -2.5);
      scene.add(dirLight2);

      const loader = new VOXLoader();
      loader.load('models/vox/monu10.vox', function (chunks) {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          // displayPalette( chunk.palette );

          const mesh = new VOXMesh(chunk);
          mesh.scale.setScalar(0.0015);
          scene.add(mesh);
        }
      });

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // controls

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 0.1;
      controls.maxDistance = 0.5;

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(() => [renderer, scene, controls, loader]);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      controls.update();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
