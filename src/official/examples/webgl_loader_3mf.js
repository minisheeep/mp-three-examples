import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_3mf',
  useLoaders: { ThreeMFLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'a',
        link: 'http://3mf.io',
        content: '3MF File format'
      }
    ],
    []
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, object, loader, controls;

    const params = {
      asset: 'cube_gears'
    };

    const assets = ['cube_gears', 'facecolors', 'multipletextures', 'vertexcolors'];

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x333333);

      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500);

      // Z is up for objects intended to be 3D printed.

      camera.up.set(0, 0, 1);
      camera.position.set(-100, -250, 100);
      scene.add(camera);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.minDistance = 50;
      controls.maxDistance = 400;
      controls.enablePan = false;
      controls.update();

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));

      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(-1, -2.5, 1);
      scene.add(light);

      loader = new ThreeMFLoader();
      loadAsset(params.asset);

      window.addEventListener('resize', onWindowResize);

      //

      const gui = new GUI();
      gui.add(params, 'asset', assets).onChange(function (value) {
        loadAsset(value);
      });

      needToDispose(renderer, scene, controls, loader);
    }

    function loadAsset(asset) {
      loader.load('models/3mf/' + asset + '.3mf', function (group) {
        if (object) {
          object.traverse(function (child) {
            if (child.material) child.material.dispose();
            if (child.material && child.material.map) child.material.map.dispose();
            if (child.geometry) child.geometry.dispose();
          });

          scene.remove(object);
        }

        //

        object = group;
        const aabb = new THREE.Box3().setFromObject(object);
        const center = aabb.getCenter(new THREE.Vector3());

        object.position.x += object.position.x - center.x;
        object.position.y += object.position.y - center.y;
        object.position.z += object.position.z - center.z;

        controls.reset();

        scene.add(object);
        render();
      });
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
