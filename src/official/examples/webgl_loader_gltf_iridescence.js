import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_iridescence',
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
        link: 'https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence',
        content: 'KHR_materials_iridescence'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Iridescence Lamp from'
      },
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/IridescenceLamp',
        content: 'glTF-Sample-Models'
      }
    ],
    [
      {
        tag: 'a',
        link: 'https://hdrihaven.com/hdri/?h=venice_sunset',
        content: 'Venice Sunset'
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

    init().catch(function (err) {
      console.error(err);
    });

    async function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setAnimationLoop(animate);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 20);
      camera.position.set(0.35, 0.05, 0.35);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      controls.autoRotateSpeed = -0.5;
      controls.target.set(0, 0.2, 0);
      controls.update();

      const rgbeLoader = new RGBELoader().setPath('textures/equirectangular/');

      const gltfLoader = new GLTFLoader().setPath('models/gltf/');

      const [texture, gltf] = await Promise.all([
        rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
        gltfLoader.loadAsync('IridescenceLamp.glb')
      ]);

      // environment

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // model

      scene.add(gltf.scene);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, rgbeLoader, gltfLoader);
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
