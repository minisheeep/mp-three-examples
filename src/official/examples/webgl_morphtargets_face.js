import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_morphtargets_face',
  useLoaders: [GLTFLoader, KTX2Loader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: 'webgl - morph targets - face' }
    ],
    [
      { tag: 'text', content: 'model by' },
      { tag: 'a', link: 'https://www.bannaflak.com/face-cap', content: 'Face Cap' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats, mixer, clock, controls, gui;

    init();

    function init() {
      clock = new THREE.Clock();

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20);
      camera.position.set(-1.8, 0.8, 3);

      scene = new THREE.Scene();

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const ktx2Loader = new KTX2Loader()
        .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/basis/')
        .detectSupport(renderer);
      new GLTFLoader()
        .setKTX2Loader(ktx2Loader)
        .setMeshoptDecoder(MeshoptDecoder)
        .load('models/gltf/facecap.glb', (gltf) => {
          const mesh = gltf.scene.children[0];

          scene.add(mesh);

          mixer = new THREE.AnimationMixer(mesh);

          mixer.clipAction(gltf.animations[0]).play();

          // GUI

          const head = mesh.getObjectByName('mesh_2');
          const influences = head.morphTargetInfluences;

          gui = new GUI();
          gui.close();

          for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
            gui.add(influences, value, 0, 1, 0.01).name(key.replace('blendShape1.', ''));
          }
        });

      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.background = new THREE.Color(0x666666);
      scene.environment = pmremGenerator.fromScene(environment).texture;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.minDistance = 2.5;
      controls.maxDistance = 5;
      controls.minAzimuthAngle = -Math.PI / 2;
      controls.maxAzimuthAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.target.set(0, 0.15, -0.2);

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls, pmremGenerator, ktx2Loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let lastUpdateDisplay = Date.now();

    function animate() {
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      if (gui && !gui.domElement._node?.closed && Date.now() - lastUpdateDisplay >= 200) {
        gui.controllers.forEach((controller) => {
          controller.updateDisplay();
        });
        lastUpdateDisplay = Date.now();
      }

      renderer.render(scene, camera);

      controls.update();

      stats.update();
    }
  }
};
export { exampleInfo as default };
