import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_pcd',
  useLoaders: [PCDLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'a',
        link: 'https://pointclouds.org/documentation/tutorials/pcd_file_format.html',
        content: 'PCD File format'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init();
    render();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.01, 40);
      camera.position.set(0, 0, 1);
      scene.add(camera);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.minDistance = 0.5;
      controls.maxDistance = 10;

      //scene.add( new THREE.AxesHelper( 1 ) );

      const loader = new PCDLoader();
      loader.load('./models/pcd/binary/Zaghetto.pcd', function (points) {
        points.geometry.center();
        points.geometry.rotateX(Math.PI);
        points.name = 'Zaghetto.pcd';
        scene.add(points);

        //

        const gui = new GUI();

        gui.add(points.material, 'size', 0.001, 0.01).onChange(render);
        gui.addColor(points.material, 'color').onChange(render);
        gui.open();

        //

        render();
      });

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls, loader);
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
