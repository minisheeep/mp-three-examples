import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_collada_kinematics',
  useLoaders: { ColladaLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'collada loader - kinematics'
      }
    ],
    [
      {
        tag: 'text',
        content: 'robot from'
      },
      {
        tag: 'a',
        link: 'https://github.com/rdiankov/collada_robots',
        content: 'collada robots'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;
    let dae;

    let kinematics;
    let kinematicsTween;
    const tweenParameters = {};

    const loader = new ColladaLoader();
    loader.load('./models/collada/abb_irb52_7_120.dae', function (collada) {
      dae = collada.scene;

      dae.traverse(function (child) {
        if (child.isMesh) {
          // model does not have normals
          child.material.flatShading = true;
        }
      });

      dae.scale.x = dae.scale.y = dae.scale.z = 10.0;
      dae.updateMatrix();

      kinematics = collada.kinematics;

      init();
    });

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.set(2, 2, 3);

      scene = new THREE.Scene();

      // Grid

      const grid = new THREE.GridHelper(20, 20, 0xc1c1c1, 0x8d8d8d);
      scene.add(grid);

      // Add the COLLADA

      scene.add(dae);

      // Lights

      const light = new THREE.HemisphereLight(0xfff7f7, 0x494966, 3);
      scene.add(light);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      setupTween();

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader);
    }

    function setupTween() {
      const duration = THREE.MathUtils.randInt(1000, 5000);

      const target = {};

      for (const prop in kinematics.joints) {
        if (kinematics.joints.hasOwnProperty(prop)) {
          if (!kinematics.joints[prop].static) {
            const joint = kinematics.joints[prop];

            const old = tweenParameters[prop];

            const position = old ? old : joint.zeroPosition;

            tweenParameters[prop] = position;

            target[prop] = THREE.MathUtils.randInt(joint.limits.min, joint.limits.max);
          }
        }
      }

      kinematicsTween = new TWEEN.Tween(tweenParameters)
        .to(target, duration)
        .easing(TWEEN.Easing.Quadratic.Out);

      kinematicsTween.onUpdate(function (object) {
        for (const prop in kinematics.joints) {
          if (kinematics.joints.hasOwnProperty(prop)) {
            if (!kinematics.joints[prop].static) {
              kinematics.setJointValue(prop, object[prop]);
            }
          }
        }
      });

      kinematicsTween.start();

      setTimeout(setupTween, duration);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      TWEEN.update();
      render();
      stats.update();
    }

    function render() {
      const timer = Date.now() * 0.0001;

      camera.position.x = Math.cos(timer) * 20;
      camera.position.y = 10;
      camera.position.z = Math.sin(timer) * 20;

      camera.lookAt(0, 5, 0);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
