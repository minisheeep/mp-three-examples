import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_transmission',
  useLoaders: [GLTFLoader, RGBELoader, DRACOLoader],
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
        link: 'https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission',
        content: 'KHR_materials_transmission'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Iridescent Dish With Olives by'
      },
      {
        tag: 'a',
        link: 'https://github.com/echadwick-wayfair',
        content: 'Eric Chadwick'
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
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    let camera, scene, renderer, controls, clock, mixer;

    init();

    function init() {
      clock = new THREE.Clock();

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
      camera.position.set(0, 0.4, 0.7);

      scene = new THREE.Scene();

      const rgbeLoader = new RGBELoader()
        .setPath('textures/equirectangular/')
        .load('royal_esplanade_1k.hdr', function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          scene.background = texture;
          scene.backgroundBlurriness = 0.35;

          scene.environment = texture;

          // model

          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath(DecoderPath.GLTF);
          const gltfLoader = new GLTFLoader()
            .setPath('models/gltf/')
            .setDRACOLoader(dracoLoader)
            .load('IridescentDishWithOlives.glb', function (gltf) {
              mixer = new THREE.AnimationMixer(gltf.scene);
              mixer.clipAction(gltf.animations[0]).play();

              scene.add(gltf.scene);
            });

          needToDispose(gltfLoader);
        });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      controls.autoRotateSpeed = -0.75;
      controls.enableDamping = true;
      controls.minDistance = 0.5;
      controls.maxDistance = 1;
      controls.target.set(0, 0.1, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls, rgbeLoader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      if (mixer) mixer.update(clock.getDelta());

      controls.update();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
