import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_envmaps_groundprojected',
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
        content: '- Ground projected environment mapping.'
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
    ],
    [
      {
        tag: 'a',
        link: 'https://polyhaven.com/a/blouberg_sunrise_2',
        content: 'Blouberg Sunrise 2'
      },
      {
        tag: 'text',
        content: 'by'
      },
      {
        tag: 'a',
        link: 'https://gregzaal.com/',
        content: 'Greg Zaal'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    const params = {
      height: 15,
      radius: 100,
      enabled: true
    };

    let camera, scene, renderer, skybox;

    init().then(render);

    async function init() {
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(-20, 7, 20);
      camera.lookAt(0, 4, 0);

      scene = new THREE.Scene();

      const hdrLoader = new RGBELoader();
      const envMap = await hdrLoader.loadAsync(
        'textures/equirectangular/blouberg_sunrise_2_1k.hdr'
      );
      envMap.mapping = THREE.EquirectangularReflectionMapping;

      skybox = new GroundedSkybox(envMap, params.height, params.radius);
      skybox.position.y = params.height - 0.01;
      scene.add(skybox);

      scene.environment = envMap;

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DecoderPath.GLTF);

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      const shadow = new THREE.TextureLoader().load('models/gltf/ferrari_ao.png');

      loader.load('models/gltf/ferrari.glb', function (gltf) {
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x000000,
          metalness: 1.0,
          roughness: 0.8,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2
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

        const carModel = gltf.scene.children[0];
        carModel.scale.multiplyScalar(4);
        carModel.rotation.y = Math.PI;

        carModel.getObjectByName('body').material = bodyMaterial;

        carModel.getObjectByName('rim_fl').material = detailsMaterial;
        carModel.getObjectByName('rim_fr').material = detailsMaterial;
        carModel.getObjectByName('rim_rr').material = detailsMaterial;
        carModel.getObjectByName('rim_rl').material = detailsMaterial;
        carModel.getObjectByName('trim').material = detailsMaterial;

        carModel.getObjectByName('glass').material = glassMaterial;

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
        carModel.add(mesh);

        scene.add(carModel);

        render();
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.target.set(0, 2, 0);
      controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
      controls.maxDistance = 80;
      controls.minDistance = 20;
      controls.enablePan = false;
      controls.update();

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      gui
        .add(params, 'enabled')
        .name('Grounded')
        .onChange(function (value) {
          if (value) {
            scene.add(skybox);
            scene.background = null;
          } else {
            scene.remove(skybox);
            scene.background = scene.environment;
          }

          render();
        });

      gui.open();

      needToDispose(renderer, scene, controls, hdrLoader, dracoLoader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
