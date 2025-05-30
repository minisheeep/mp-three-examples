import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_controls_trackball',
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
        content: '- trackball controls'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let perspectiveCamera, orthographicCamera, controls, scene, renderer, stats;

    const params = {
      orthographicCamera: false
    };

    const frustumSize = 400;

    init();

    function init() {
      const aspect = window.innerWidth / window.innerHeight;

      perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
      perspectiveCamera.position.z = 500;

      orthographicCamera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        1,
        1000
      );
      orthographicCamera.position.z = 500;

      // world

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xcccccc);
      scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

      const geometry = new THREE.ConeGeometry(10, 30, 4, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

      for (let i = 0; i < 500; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (Math.random() - 0.5) * 1000;
        mesh.position.y = (Math.random() - 0.5) * 1000;
        mesh.position.z = (Math.random() - 0.5) * 1000;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
      }

      // lights

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
      dirLight1.position.set(1, 1, 1);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x002288, 3);
      dirLight2.position.set(-1, -1, -1);
      scene.add(dirLight2);

      const ambientLight = new THREE.AmbientLight(0x555555);
      scene.add(ambientLight);

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      //

      const gui = new GUI();
      gui
        .add(params, 'orthographicCamera')
        .name('use orthographic')
        .onChange(function (value) {
          controls.dispose();

          createControls(value ? orthographicCamera : perspectiveCamera);
        });

      //

      window.addEventListener('resize', onWindowResize);

      createControls(perspectiveCamera);

      needToDispose(() => [renderer, scene, controls]);
    }

    function createControls(camera) {
      controls = new TrackballControls(camera, renderer.domElement);

      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;

      controls.keys = ['KeyA', 'KeyS', 'KeyD'];
    }

    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;

      perspectiveCamera.aspect = aspect;
      perspectiveCamera.updateProjectionMatrix();

      orthographicCamera.left = (-frustumSize * aspect) / 2;
      orthographicCamera.right = (frustumSize * aspect) / 2;
      orthographicCamera.top = frustumSize / 2;
      orthographicCamera.bottom = -frustumSize / 2;
      orthographicCamera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      controls.handleResize();
    }

    function animate() {
      controls.update();

      render();

      stats.update();
    }

    function render() {
      const camera = params.orthographicCamera ? orthographicCamera : perspectiveCamera;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
