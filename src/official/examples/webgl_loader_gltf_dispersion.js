import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_dispersion',
  useLoaders: { GLTFLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- GLTFLoader +' }
    ],
    [
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_dispersion',
        content: '  KHR_materials_dispersion'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init().then(render);

    async function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5);
      camera.position.set(0.1, 0.05, 0.15);

      scene = new THREE.Scene();

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene = new THREE.Scene();
      scene.backgroundBlurriness = 0.5;

      const env = pmremGenerator.fromScene(environment).texture;
      scene.background = env;
      scene.environment = env;
      environment.dispose();

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('models/gltf/DispersionTest.glb');

      scene.add(gltf.scene);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.minDistance = 0.1;
      controls.maxDistance = 10;
      controls.target.set(0, 0, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, pmremGenerator, environment, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    //

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
