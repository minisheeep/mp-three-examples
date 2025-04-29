import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_ultrahdr',
  useLoaders: { UltraHDRLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- UltraHDR texture loader' }
    ],
    [
      { tag: 'text', content: 'Converted from hdr with' },
      { tag: 'a', link: 'https://gainmap-creator.mono-grid.com/', content: 'converter' },
      { tag: 'text', content: '.' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const params = {
      autoRotate: true,
      metalness: 1.0,
      roughness: 0.0,
      exposure: 1.0,
      resolution: '2k',
      type: 'HalfFloatType'
    };

    let renderer, scene, camera, controls, torusMesh, loader;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = params.exposure;

      renderer.setAnimationLoop(render);

      scene = new THREE.Scene();

      torusMesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.4, 128, 128, 1, 3),
        new THREE.MeshStandardMaterial({ roughness: params.roughness, metalness: params.metalness })
      );
      scene.add(torusMesh);

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 500);
      camera.position.set(0.0, 0.0, -6.0);

      controls = new OrbitControls(camera, renderer.domElement);

      loader = new UltraHDRLoader();
      loader.setDataType(THREE.FloatType);

      const loadEnvironment = function (resolution = '2k', type = 'HalfFloatType') {
        loader.setDataType(THREE[type]);

        loader.load(
          `textures/equirectangular/spruit_sunrise_${resolution}.hdr.jpg`,
          function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.needsUpdate = true;

            scene.background = texture;
            scene.environment = texture;
          }
        );
      };

      loadEnvironment(params.resolution, params.type);

      const gui = new GUI();

      gui.add(params, 'autoRotate');
      gui.add(params, 'metalness', 0, 1, 0.01);
      gui.add(params, 'roughness', 0, 1, 0.01);
      gui.add(params, 'exposure', 0, 4, 0.01);
      gui.add(params, 'resolution', ['2k', '4k']).onChange((value) => {
        loadEnvironment(value, params.type);
      });
      gui.add(params, 'type', ['HalfFloatType', 'FloatType']).onChange((value) => {
        loadEnvironment(params.resolution, value);
      });

      gui.open();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
      torusMesh.material.roughness = params.roughness;
      torusMesh.material.metalness = params.metalness;

      if (params.autoRotate) {
        torusMesh.rotation.y += 0.005;
      }

      renderer.toneMappingExposure = params.exposure;

      controls.update();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
