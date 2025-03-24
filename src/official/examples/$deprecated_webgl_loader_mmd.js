import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
import Ammo from 'three/examples/jsm/libs/ammo.wasm.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_mmd',
  useLoaders: [MMDLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- MMDLoader test' }
    ],
    [
      {
        tag: 'a',
        link: 'https://github.com/mrdoob/three.js/tree/master/examples/models/mmd#readme',
        content: 'MMD Assets license'
      },
      { tag: 'text', content: 'Copyright' },
      { tag: 'a', link: 'https://sites.google.com/view/evpvp/', content: 'Model Data' },
      { tag: 'a', link: 'http://www.nicovideo.jp/watch/sm13147122', content: 'Dance Data' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let mesh, camera, scene, renderer, effect;
    let helper, ikHelper, physicsHelper;

    const clock = new THREE.Clock();

    Ammo.call({}).then(function (AmmoLib) {
      globalThis['Ammo'] = AmmoLib;
      init();
      needToDispose({
        dispose: () => {
          globalThis['Ammo'] = null;
        }
      });
    });

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 30;

      // scene

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      const gridHelper = new THREE.PolarGridHelper(30, 0);
      gridHelper.position.y = -10;
      scene.add(gridHelper);

      const ambient = new THREE.AmbientLight(0xaaaaaa, 3);
      scene.add(ambient);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(-1, 1, 1).normalize();
      scene.add(directionalLight);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      effect = new OutlineEffect(renderer);

      // STATS

      stats = new Stats(renderer);

      // model

      function onProgress(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
      }

      const modelFile = 'models/mmd/miku/miku_v2.pmd';
      const vmdFiles = ['models/mmd/vmds/wavefile_v2.vmd'];

      helper = new MMDAnimationHelper({
        afterglow: 2.0
      });

      const loader = new MMDLoader();

      loader.loadWithAnimation(
        modelFile,
        vmdFiles,
        function (mmd) {
          mesh = mmd.mesh;
          mesh.position.y = -10;
          scene.add(mesh);

          helper.add(mesh, {
            animation: mmd.animation,
            physics: true
          });

          ikHelper = helper.objects.get(mesh).ikSolver.createHelper();
          ikHelper.visible = false;
          scene.add(ikHelper);

          physicsHelper = helper.objects.get(mesh).physics.createHelper();
          physicsHelper.visible = false;
          scene.add(physicsHelper);

          initGui();
        },
        onProgress,
        null
      );

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 100;

      window.addEventListener('resize', onWindowResize);

      function initGui() {
        const api = {
          animation: true,
          ik: true,
          outline: true,
          physics: true,
          'show IK bones': false,
          'show rigid bodies': false
        };

        const gui = new GUI();

        gui.add(api, 'animation').onChange(function () {
          helper.enable('animation', api['animation']);
        });

        gui.add(api, 'ik').onChange(function () {
          helper.enable('ik', api['ik']);
        });

        gui.add(api, 'outline').onChange(function () {
          effect.enabled = api['outline'];
        });

        gui.add(api, 'physics').onChange(function () {
          helper.enable('physics', api['physics']);
        });

        gui.add(api, 'show IK bones').onChange(function () {
          ikHelper.visible = api['show IK bones'];
        });

        gui.add(api, 'show rigid bodies').onChange(function () {
          if (physicsHelper !== undefined) physicsHelper.visible = api['show rigid bodies'];
        });
      }

      needToDispose(renderer, scene, controls, loader, helper);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      helper.update(clock.getDelta());
      effect.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
