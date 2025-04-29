import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_nrrd',
  useLoaders: { NRRDLoader, VTKLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- NRRD format loader test'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, camera, controls, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1e10);
      camera.position.z = 300;

      scene = new THREE.Scene();

      scene.add(camera);

      // light

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(200, 200, 200);
      scene.add(dirLight);

      const loader = new NRRDLoader();
      loader.load('models/nrrd/I.nrrd', function (volume) {
        //box helper to see the extend of the volume
        const geometry = new THREE.BoxGeometry(volume.xLength, volume.yLength, volume.zLength);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.visible = false;
        const box = new THREE.BoxHelper(cube);
        scene.add(box);
        box.applyMatrix4(volume.matrix);
        scene.add(cube);

        //z plane
        const sliceZ = volume.extractSlice('z', Math.floor(volume.RASDimensions[2] / 4));
        scene.add(sliceZ.mesh);

        //y plane
        const sliceY = volume.extractSlice('y', Math.floor(volume.RASDimensions[1] / 2));
        scene.add(sliceY.mesh);

        //x plane
        const sliceX = volume.extractSlice('x', Math.floor(volume.RASDimensions[0] / 2));
        scene.add(sliceX.mesh);

        gui
          .add(sliceX, 'index', 0, volume.RASDimensions[0], 1)
          .name('indexX')
          .onChange(function () {
            sliceX.repaint.call(sliceX);
          });
        gui
          .add(sliceY, 'index', 0, volume.RASDimensions[1], 1)
          .name('indexY')
          .onChange(function () {
            sliceY.repaint.call(sliceY);
          });
        gui
          .add(sliceZ, 'index', 0, volume.RASDimensions[2], 1)
          .name('indexZ')
          .onChange(function () {
            sliceZ.repaint.call(sliceZ);
          });

        gui
          .add(volume, 'lowerThreshold', volume.min, volume.max, 1)
          .name('Lower Threshold')
          .onChange(function () {
            volume.repaintAllSlices();
          });
        gui
          .add(volume, 'upperThreshold', volume.min, volume.max, 1)
          .name('Upper Threshold')
          .onChange(function () {
            volume.repaintAllSlices();
          });
        gui
          .add(volume, 'windowLow', volume.min, volume.max, 1)
          .name('Window Low')
          .onChange(function () {
            volume.repaintAllSlices();
          });
        gui
          .add(volume, 'windowHigh', volume.min, volume.max, 1)
          .name('Window High')
          .onChange(function () {
            volume.repaintAllSlices();
          });
      });

      const vtkmaterial = new THREE.MeshLambertMaterial({
        wireframe: false,
        side: THREE.DoubleSide,
        color: 0xff0000
      });

      const vtkloader = new VTKLoader();
      vtkloader.load('models/vtk/liver.vtk', function (geometry) {
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, vtkmaterial);
        scene.add(mesh);
        const visibilityControl = {
          visible: true
        };
        gui
          .add(visibilityControl, 'visible')
          .name('Model Visible')
          .onChange(function () {
            mesh.visible = visibilityControl.visible;
            renderer.render(scene, camera);
          });
      });
      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      controls = new TrackballControls(camera, renderer.domElement);
      controls.minDistance = 100;
      controls.maxDistance = 500;
      controls.rotateSpeed = 5.0;
      controls.zoomSpeed = 5;
      controls.panSpeed = 2;

      stats = new Stats(renderer);

      const gui = new GUI();
      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, loader, scene, controls, vtkloader);
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
