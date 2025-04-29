import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_video_webcam',
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
        content: 'webgl - video webcam input'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, getCameraTexture }) => {
    let camera, scene, renderer, video;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 0.01;

      scene = new THREE.Scene();

      const texture = getCameraTexture();
      texture.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.PlaneGeometry(16, 9);
      geometry.scale(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ map: texture });

      const count = 128;
      const radius = 32;

      for (let i = 1, l = count; i <= l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.setFromSphericalCoords(radius, phi, theta);
        mesh.lookAt(camera.position);
        scene.add(mesh);
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
