import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_obj_mtl',
  useLoaders: [MTLLoader, OBJLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- OBJLoader + MTLLoader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

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

      // model

      const onProgress = function (xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(percentComplete.toFixed(2) + '% downloaded');
        }
      };

      new MTLLoader().setPath('models/obj/male02/').load('male02.mtl', function (materials) {
        materials.preload();

        new OBJLoader()
          .setMaterials(materials)
          .setPath('models/obj/male02/')
          .load(
            'male02.obj',
            function (object) {
              object.position.y = -0.95;
              object.scale.setScalar(0.01);
              scene.add(object);
            },
            onProgress
          );
      });
      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 2;
      controls.maxDistance = 5;

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
