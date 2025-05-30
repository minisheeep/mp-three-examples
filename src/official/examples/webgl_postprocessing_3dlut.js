import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { LUTPass } from 'three/examples/jsm/postprocessing/LUTPass.js';
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader.js';
import { LUT3dlLoader } from 'three/examples/jsm/loaders/LUT3dlLoader.js';
import { LUTImageLoader } from 'three/examples/jsm/loaders/LUTImageLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_3dlut',
  useLoaders: { GLTFLoader, RGBELoader, LUTCubeLoader, LUT3dlLoader, LUTImageLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- 3D LUTs'
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
    ],
    [
      {
        tag: 'text',
        content: 'LUTs from'
      },
      {
        tag: 'a',
        link: 'https://www.rocketstock.com/free-after-effects-templates/35-free-luts-for-color-grading-videos/',
        content: '  RocketStock'
      },
      {
        tag: 'text',
        content: ','
      },
      {
        tag: 'a',
        link: 'https://www.freepresets.com/product/free-luts-cinematic/',
        content: 'FreePresets.com'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const params = {
      enabled: true,
      lut: 'Bourbon 64.CUBE',
      intensity: 1
    };

    const lutMap = {
      'Bourbon 64.CUBE': null,
      'Chemical 168.CUBE': null,
      'Clayton 33.CUBE': null,
      'Cubicle 99.CUBE': null,
      'Remy 24.CUBE': null,
      'Presetpro-Cinematic.3dl': null,
      NeutralLUT: null,
      'B&WLUT': null,
      NightLUT: null
    };

    let gui;
    let camera, scene, renderer;
    let composer, lutPass;

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

          // model

          const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');
          loader.load('DamagedHelmet.gltf', function (gltf) {
            scene.add(gltf.scene);
          });
          needToDispose(loader);
        });

      Object.keys(lutMap).forEach((name) => {
        if (/\.CUBE$/i.test(name)) {
          new LUTCubeLoader().load('luts/' + name, function (result) {
            lutMap[name] = result;
          });
        } else if (/\LUT$/i.test(name)) {
          new LUTImageLoader().load(`luts/${name}.png`, function (result) {
            lutMap[name] = result;
          });
        } else {
          new LUT3dlLoader().load('luts/' + name, function (result) {
            lutMap[name] = result;
          });
        }
      });

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(window.devicePixelRatio);
      composer.setSize(window.innerWidth, window.innerHeight);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new OutputPass());

      lutPass = new LUTPass();
      composer.addPass(lutPass);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.target.set(0, 0, -0.2);
      controls.update();

      gui = new GUI();
      gui.width = 350;
      gui.add(params, 'enabled');
      gui.add(params, 'lut', Object.keys(lutMap));
      gui.add(params, 'intensity').min(0).max(1);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, rgbeLoader, composer);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      lutPass.enabled = params.enabled && Boolean(lutMap[params.lut]);
      lutPass.intensity = params.intensity;
      if (lutMap[params.lut]) {
        const lut = lutMap[params.lut];
        lutPass.lut = lut.texture3D;
      }

      composer.render();
    }
  }
};
export { exampleInfo as default };
