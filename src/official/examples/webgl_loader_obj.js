import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_obj',
  useLoaders: { OBJLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- OBJLoader test'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    let object;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
      camera.position.z = 2.5;

      // scene

      scene = new THREE.Scene();

      const ambientLight = new THREE.AmbientLight(0xffffff);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 15);
      camera.add(pointLight);
      scene.add(camera);

      // texture

      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load('textures/uv_grid_opengl.jpg', render);
      texture.colorSpace = THREE.SRGBColorSpace;
      // model

      function onProgress(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log('model ' + percentComplete.toFixed(2) + '% downloaded');
        }
      }

      function onError() {}

      const loader = new OBJLoader();
      loader.load(
        'models/obj/male02/male02.obj',
        function (obj) {
          object = obj;

          object.traverse(function (child) {
            if (child.isMesh) child.material.map = texture;
          });

          object.position.y = -0.95;
          object.scale.setScalar(0.01);
          scene.add(object);

          render();
        },
        onProgress,
        onError
      );

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 2;
      controls.maxDistance = 5;
      controls.addEventListener('change', render);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, controls, scene, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
