import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_sheen',
  useLoaders: [GLTFLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- GLTFLoader +' }
    ],
    [
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_sheen',
        content: '  KHR_materials_sheen'
      },
      { tag: 'text', content: 'Sheen Chair from' },
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/SheenChair',
        content: 'glTF-Sample-Models'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
      camera.position.set(-0.75, 0.7, 1.25);

      scene = new THREE.Scene();

      // model

      const gltfLoader = new GLTFLoader()
        .setPath('models/gltf/')
        .load('SheenChair.glb', function (gltf) {
          scene.add(gltf.scene);

          const object = gltf.scene.getObjectByName('SheenChair_fabric');

          const gui = new GUI();

          gui.add(object.material, 'sheen', 0, 1);
          gui.open();
        });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.background = new THREE.Color(0xbbbbbb);
      scene.environment = pmremGenerator.fromScene(environment).texture;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.minDistance = 1;
      controls.maxDistance = 10;
      controls.target.set(0, 0.35, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, gltfLoader, environment, pmremGenerator);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      controls.update(); // required if damping enabled

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
