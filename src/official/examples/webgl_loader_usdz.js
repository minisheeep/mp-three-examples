import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_usdz',
  useLoaders: { RGBELoader, USDZLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- USDZLoader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    //fix the incorrect way to use a Blob in USDZLoader
    const OriginBlob = globalThis['Blob'];

    globalThis['Blob'] = class Blob extends OriginBlob {
      constructor(blobParts, options) {
        if (typeof options?.type === 'object' && options.type.type) {
          options = options.type;
        }
        super(blobParts, options);
      }
    };

    needToDispose({
      dispose() {
        globalThis['Blob'] = OriginBlob;
      }
    });

    let camera, scene, renderer;

    init();

    async function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0.75, -1.5);

      scene = new THREE.Scene();

      const rgbeLoader = new RGBELoader().setPath('textures/equirectangular/');

      const usdzLoader = new USDZLoader().setPath('models/usdz/');

      const [texture, model] = await Promise.all([
        rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
        usdzLoader.loadAsync('saeukkang.usdz')
      ]);

      // environment

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.backgroundBlurriness = 0.5;
      scene.environment = texture;

      // model

      model.position.y = 0.25;
      model.position.z = -0.25;
      scene.add(model);

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 2.0;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 1;
      controls.maxDistance = 8;
      // controls.target.y = 15;
      // controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, rgbeLoader, usdzLoader, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
