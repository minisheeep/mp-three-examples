import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_shaders_sky',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - sky + sun shader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    let sky, sun;

    init();
    render();

    function initSky() {
      // Add Sky
      sky = new Sky();
      sky.scale.setScalar(450000);
      scene.add(sky);

      sun = new THREE.Vector3();

      /// GUI

      const effectController = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
      };

      function guiChanged() {
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera);
      }

      const gui = new GUI();

      gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
      gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
      gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
      gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
      gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
      gui.add(effectController, 'azimuth', -180, 180, 0.1).onChange(guiChanged);
      gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

      guiChanged();
    }

    function init() {
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        100,
        2000000
      );
      camera.position.set(0, 100, 2000);

      scene = new THREE.Scene();

      const helper = new THREE.GridHelper(10000, 2, 0xffffff, 0xffffff);
      scene.add(helper);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.5;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      //controls.maxPolarAngle = Math.PI / 2;
      controls.enableZoom = false;
      controls.enablePan = false;

      initSky();

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
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
