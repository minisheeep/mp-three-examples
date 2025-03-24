import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf',
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
        content: '- GLTFLoader'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Battle Damaged Sci-fi Helmet by'
      },
      {
        tag: 'a',
        link: 'https://sketchfab.com/theblueturtle_',
        content: 'theblueturtle_'
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
    let camera, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
      camera.position.set(-1.8, 0.6, 2.7);

      scene = new THREE.Scene();

      const rgbeLoader = new RGBELoader()
        .setPath('textures/equirectangular/')
        .load('royal_esplanade_1k.hdr', function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          scene.background = texture;
          scene.environment = texture;

          render();

          // model

          const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');
          loader.load('DamagedHelmet.gltf', async function (gltf) {
            const model = gltf.scene;

            // wait until the model can be added to the scene without blocking due to shader compilation

            await renderer.compileAsync(model, camera, scene);

            scene.add(model);

            render();
          });

          needToDispose(loader);
        });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.target.set(0, 0, -0.2);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, rgbeLoader);
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
