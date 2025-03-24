import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_multiple_scenes_comparison',
  useLoaders: [],
  needSlider: {
    direction: 'vertical',
    initPosition: 50
  },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- multiple scenes comparison'
      }
    ],
    []
  ],
  init: ({
    window,
    canvas,
    GUI,
    Stats,
    needToDispose,
    useFrame,
    onSlideStart,
    onSlideEnd,
    onSlideChange
  }) => {
    let camera, renderer, controls;
    let sceneL, sceneR;

    let sliderPos = window.innerWidth / 2;

    init();

    function init() {
      sceneL = new THREE.Scene();
      sceneL.background = new THREE.Color(0xbcd48f);

      sceneR = new THREE.Scene();
      sceneR.background = new THREE.Color(0x8fbcd4);

      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 6;

      const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3);

      light.position.set(-2, 2, 2);
      sceneL.add(light.clone());
      sceneR.add(light.clone());
      initMeshes();

      initSlider();
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setScissorTest(true);
      renderer.setAnimationLoop(animate);
      controls = new OrbitControls(camera, renderer.domElement);

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, sceneL, sceneR, controls);
    }

    function initMeshes() {
      const geometry = new THREE.IcosahedronGeometry(1, 3);

      const meshL = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      sceneL.add(meshL);

      const meshR = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ wireframe: true }));
      sceneR.add(meshR);
    }

    function initSlider() {
      onSlideStart(() => {
        controls.enabled = false;
      });
      onSlideEnd(() => {
        controls.enabled = true;
      });
      onSlideChange((offset, size) => {
        sliderPos = (size * offset) / 100;
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.setScissor(0, 0, sliderPos, window.innerHeight);
      renderer.render(sceneL, camera);

      renderer.setScissor(sliderPos, 0, window.innerWidth, window.innerHeight);
      renderer.render(sceneR, camera);
    }
  }
};
export { exampleInfo as default };
