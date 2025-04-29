import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_car',
  useLoaders: { GLTFLoader, DRACOLoader, RGBELoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'car materials'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Ferrari 458 Italia model by'
      },
      {
        tag: 'a',
        link: 'https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6',
        content: 'vicent091036'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    let camera, scene, renderer;
    let stats;

    let grid;
    let controls;

    const wheels = [];

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      window.addEventListener('resize', onWindowResize);

      stats = new Stats(renderer);

      //

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(4.25, 1.4, -4.5);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.maxDistance = 9;
      controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
      controls.target.set(0, 0.5, 0);
      controls.update();

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x333333);
      scene.environment = new RGBELoader().load('textures/equirectangular/venice_sunset_1k.hdr');
      scene.environment.mapping = THREE.EquirectangularReflectionMapping;
      scene.fog = new THREE.Fog(0x333333, 10, 15);

      grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
      grid.material.opacity = 0.2;
      grid.material.depthWrite = false;
      grid.material.transparent = true;
      scene.add(grid);

      // materials

      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 1.0,
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03
      });

      const detailsMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.5
      });

      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.25,
        roughness: 0,
        transmission: 1.0
      });

      const gui = new GUI();
      gui
        .addColor({ color: bodyMaterial.color }, 'color')
        .name('body-color')
        .onChange((value) => {
          bodyMaterial.color.set(value);
        });
      gui
        .addColor({ color: detailsMaterial.color }, 'color')
        .name('details-color')
        .onChange((value) => {
          detailsMaterial.color.set(value);
        });
      gui
        .addColor({ color: glassMaterial.color }, 'color')
        .name('glass-color')
        .onChange((value) => {
          glassMaterial.color.set(value);
        });

      // const bodyColorInput = document.getElementById('body-color');
      // bodyColorInput.addEventListener('input', function () {
      //   bodyMaterial.color.set(this.value);
      // });

      // const detailsColorInput = document.getElementById('details-color');
      // detailsColorInput.addEventListener('input', function () {
      //   detailsMaterial.color.set(this.value);
      // });
      //
      // const glassColorInput = document.getElementById('glass-color');
      // glassColorInput.addEventListener('input', function () {
      //   glassMaterial.color.set(this.value);
      // });

      // Car

      const shadow = new THREE.TextureLoader().load('models/gltf/ferrari_ao.png');

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DecoderPath.GLTF);

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      loader.load('models/gltf/ferrari.glb', function (gltf) {
        const carModel = gltf.scene.children[0];

        carModel.getObjectByName('body').material = bodyMaterial;

        carModel.getObjectByName('rim_fl').material = detailsMaterial;
        carModel.getObjectByName('rim_fr').material = detailsMaterial;
        carModel.getObjectByName('rim_rr').material = detailsMaterial;
        carModel.getObjectByName('rim_rl').material = detailsMaterial;
        carModel.getObjectByName('trim').material = detailsMaterial;

        carModel.getObjectByName('glass').material = glassMaterial;

        wheels.push(
          carModel.getObjectByName('wheel_fl'),
          carModel.getObjectByName('wheel_fr'),
          carModel.getObjectByName('wheel_rl'),
          carModel.getObjectByName('wheel_rr')
        );

        // shadow
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
          new THREE.MeshBasicMaterial({
            map: shadow,
            blending: THREE.MultiplyBlending,
            toneMapped: false,
            transparent: true
          })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 2;
        carModel.add(mesh);

        scene.add(carModel);
        needToDispose(renderer, scene, controls, dracoLoader);
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const startTime = Date.now();

    function animate() {
      controls.update();

      const time = -(Date.now() - startTime) / 1000;

      for (let i = 0; i < wheels.length; i++) {
        wheels[i].rotation.x = time * Math.PI * 2;
      }

      grid.position.z = -time % 1;

      renderer.render(scene, camera);

      stats.update();
    }

    init();
  }
};
export { exampleInfo as default };
