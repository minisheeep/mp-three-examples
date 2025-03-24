import * as THREE from 'three';
import { RGBMLoader } from 'three/examples/jsm/loaders/RGBMLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_rgbm',
  useLoaders: [RGBMLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- webgl RGBM texture loader example'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const params = {
      exposure: 2.0
    };

    let renderer, scene, camera;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = params.exposure;

      scene = new THREE.Scene();

      const aspect = window.innerWidth / window.innerHeight;

      camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 1);

      const rgbmLoader = new RGBMLoader()
        .setMaxRange(16)
        .load('textures/memorial.png', function (texture) {
          const material = new THREE.MeshBasicMaterial({ map: texture });

          const quad = new THREE.PlaneGeometry(1, 1.5);

          const mesh = new THREE.Mesh(quad, material);

          scene.add(mesh);

          render();
        });

      //

      const gui = new GUI();

      gui.add(params, 'exposure', 0, 4, 0.01).onChange(render);
      gui.open();

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, rgbmLoader);
    }

    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;

      const frustumHeight = camera.top - camera.bottom;

      camera.left = (-frustumHeight * aspect) / 2;
      camera.right = (frustumHeight * aspect) / 2;

      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    //

    function render() {
      renderer.toneMappingExposure = params.exposure;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
