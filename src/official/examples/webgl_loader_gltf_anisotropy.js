import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_anisotropy',
  useLoaders: [GLTFLoader, RGBELoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- GLTFLoader +'
      },
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_anisotropy',
        content: '  KHR_materials_anisotropy'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Anisotropy Barn Lamp from'
      },
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/AnisotropyBarnLamp',
        content: 'glTF-Sample-Models'
      }
    ],
    [
      {
        tag: 'a',
        link: 'https://hdrihaven.com/hdri/?h=royal_esplanade',
        content: 'Royal Esplanade'
      },
      {
        tag: 'text',
        content: 'from'
      },
      {
        tag: 'a',
        link: 'https://hdrihaven.com/',
        content: 'HDRI Haven'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera, controls;

    init();

    async function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 10);
      camera.position.set(-0.35, -0.2, 0.35);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, -0.08, 0.11);
      controls.minDistance = 0.1;
      controls.maxDistance = 2;
      controls.addEventListener('change', render);
      controls.update();

      const rgbeLoader = new RGBELoader().setPath('textures/equirectangular/');
      const gltfLoader = new GLTFLoader().setPath('models/gltf/');

      const [texture, gltf] = await Promise.all([
        rgbeLoader.loadAsync('royal_esplanade_1k.hdr'),
        gltfLoader.loadAsync('AnisotropyBarnLamp.glb')
      ]);

      // environment

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.backgroundBlurriness = 0.5;
      scene.environment = texture;

      // model

      scene.add(gltf.scene);

      render();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, rgbeLoader, gltfLoader);
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
