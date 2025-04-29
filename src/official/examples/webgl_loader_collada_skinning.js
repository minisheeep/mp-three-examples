import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_collada_skinning',
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
        content: 'collada loader - skinning'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Dancing Stormtrooper by'
      },
      {
        tag: 'a',
        link: 'https://sketchfab.com/strykerdoesgames',
        content: 'StrykerDoesAnimation'
      },
      {
        tag: 'text',
        content: ','
      },
      {
        tag: 'a',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        content: 'CC Attribution'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, clock, controls;
    let camera, scene, renderer, mixer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(15, 10, -15);

      scene = new THREE.Scene();

      clock = new THREE.Clock();

      // collada

      const loader = new ColladaLoader();
      loader.load('./models/collada/stormtrooper/stormtrooper.dae', function (collada) {
        const avatar = collada.scene;
        const animations = avatar.animations;

        mixer = new THREE.AnimationMixer(avatar);
        mixer.clipAction(animations[0]).play();

        scene.add(avatar);
        needToDispose(mixer);
      });

      //

      const gridHelper = new THREE.GridHelper(10, 20, 0xc1c1c1, 0x8d8d8d);
      scene.add(gridHelper);

      //

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(1.5, 1, -1.5);
      scene.add(directionalLight);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.screenSpacePanning = true;
      controls.minDistance = 5;
      controls.maxDistance = 40;
      controls.target.set(0, 2, 0);
      controls.update();

      //

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      const delta = clock.getDelta();

      if (mixer !== undefined) {
        mixer.update(delta);
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
