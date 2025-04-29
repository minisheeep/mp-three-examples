import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_vrml',
  useLoaders: { VRMLLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- VRML loader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats, controls, loader;

    const params = {
      asset: 'house'
    };

    const assets = [
      'creaseAngle',
      'crystal',
      'house',
      'elevationGrid1',
      'elevationGrid2',
      'extrusion1',
      'extrusion2',
      'extrusion3',
      'lines',
      'linesTransparent',
      'meshWithLines',
      'meshWithTexture',
      'pixelTexture',
      'points'
    ];

    let vrmlScene;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1e10);
      camera.position.set(-10, 5, 10);

      scene = new THREE.Scene();
      scene.add(camera);

      // light

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight.position.set(200, 200, 200);
      scene.add(dirLight);

      loader = new VRMLLoader();
      loadAsset(params.asset);

      // renderer

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // controls

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 1;
      controls.maxDistance = 200;
      controls.enableDamping = true;

      //

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      //

      const gui = new GUI();
      gui.add(params, 'asset', assets).onChange(function (value) {
        if (vrmlScene) {
          vrmlScene.traverse(function (object) {
            if (object.material) object.material.dispose();
            if (object.material && object.material.map) object.material.map.dispose();
            if (object.geometry) object.geometry.dispose();
          });

          scene.remove(vrmlScene);
        }

        loadAsset(value);
      });

      needToDispose(renderer, scene, controls, loader);
    }

    function loadAsset(asset) {
      loader.load('models/vrml/' + asset + '.wrl', function (object) {
        vrmlScene = object;
        scene.add(object);
        controls.reset();
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      controls.update(); // to support damping

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
