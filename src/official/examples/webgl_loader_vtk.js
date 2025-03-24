import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_vtk',
  useLoaders: [VTKLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- vtk formats loader test' }
    ],
    [
      { tag: 'text', content: 'Legacy vtk model from' },
      {
        tag: 'a',
        link: 'http://www.cc.gatech.edu/projects/large_models/',
        content: 'The GeorgiaTech Lagre Geometric Model Archive'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, controls, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
      camera.position.z = 0.2;

      scene = new THREE.Scene();

      scene.add(camera);

      // light

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(2, 2, 2);
      scene.add(dirLight);

      const loader = new VTKLoader();
      loader.load('models/vtk/bunny.vtk', function (geometry) {
        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-0.075, 0.005, 0);
        mesh.scale.multiplyScalar(0.2);
        scene.add(mesh);
      });

      const loader1 = new VTKLoader();
      loader1.load('models/vtk/cube_ascii.vtp', function (geometry) {
        geometry.computeVertexNormals();
        geometry.center();

        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(-0.025, 0, 0);
        mesh.scale.multiplyScalar(0.01);

        scene.add(mesh);
      });

      const loader2 = new VTKLoader();
      loader2.load('models/vtk/cube_binary.vtp', function (geometry) {
        geometry.computeVertexNormals();
        geometry.center();

        const material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(0.025, 0, 0);
        mesh.scale.multiplyScalar(0.01);

        scene.add(mesh);
      });

      const loader3 = new VTKLoader();
      loader3.load('models/vtk/cube_no_compression.vtp', function (geometry) {
        geometry.computeVertexNormals();
        geometry.center();

        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(0.075, 0, 0);
        mesh.scale.multiplyScalar(0.01);

        scene.add(mesh);
      });

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // controls

      controls = new TrackballControls(camera, renderer.domElement);
      controls.minDistance = 0.1;
      controls.maxDistance = 0.5;
      controls.rotateSpeed = 5.0;

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader, loader1, loader2, loader3);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      controls.handleResize();
    }

    function animate() {
      controls.update();

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
