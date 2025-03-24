import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_avif',
  useLoaders: [GLTFLoader, DRACOLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- GLTFLoader +' }
    ],
    [
      {
        tag: 'a',
        link: 'https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif',
        content: 'EXT_texture_avif'
      },
      { tag: 'text', content: 'Forest House by' },
      { tag: 'a', link: 'https://sketchfab.com/peachyroyalty', content: 'peachyroyalty' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    let camera, scene, renderer;

    init();
    render();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(1.5, 4, 9);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf6eedc);

      //

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DecoderPath.GLTF);

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.setPath('models/gltf/AVIFTest/');
      loader.load(
        'forest_house.glb',
        function (gltf) {
          scene.add(gltf.scene);

          render();
        },
        null
      );

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.target.set(0, 2, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, dracoLoader, loader, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    //

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
