import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_hdr',
  useLoaders: [RGBELoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl HDR (RGBE) texture loader example' }
    ],
    [
      { tag: 'text', content: 'Image courtesy of' },
      { tag: 'a', link: 'http://www.pauldebevec.com/Research/HDR/', content: 'Paul Debevec' },
      { tag: 'text', content: '.' }
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

      const rgbeLoader = new RGBELoader().load(
        'textures/memorial.hdr',
        function (texture, textureData) {
          //console.log( textureData );
          //console.log( texture );

          const material = new THREE.MeshBasicMaterial({ map: texture });

          const quad = new THREE.PlaneGeometry((1.5 * textureData.width) / textureData.height, 1.5);

          const mesh = new THREE.Mesh(quad, material);

          scene.add(mesh);

          render();
        }
      );

      //

      const gui = new GUI();

      gui.add(params, 'exposure', 0, 4, 0.01).onChange(render);
      gui.open();

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, rgbeLoader);
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
