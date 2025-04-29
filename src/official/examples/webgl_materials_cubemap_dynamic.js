import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_cubemap_dynamic',
  useLoaders: { RGBELoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - materials - dynamic cube reflection'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;
    let cube, sphere, torus, material;

    let cubeCamera, cubeRenderTarget;

    let controls;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      window.addEventListener('resize', onWindowResized);

      stats = new Stats(renderer);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 75;

      scene = new THREE.Scene();
      scene.rotation.y = 0.5; // avoid flying objects occluding the sun

      const rgbeLoader = new RGBELoader()
        .setPath('textures/equirectangular/')
        .load('quarry_01_1k.hdr', function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          scene.background = texture;
          scene.environment = texture;
        });
      //

      cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
      cubeRenderTarget.texture.type = THREE.HalfFloatType;

      cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);

      //

      material = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        roughness: 0.05,
        metalness: 1
      });

      const gui = new GUI();
      gui.add(material, 'roughness', 0, 1);
      gui.add(material, 'metalness', 0, 1);
      gui.add(renderer, 'toneMappingExposure', 0, 2).name('exposure');

      sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 8), material);
      scene.add(sphere);

      const material2 = new THREE.MeshStandardMaterial({
        roughness: 0.1,
        metalness: 0
      });

      cube = new THREE.Mesh(new THREE.BoxGeometry(15, 15, 15), material2);
      scene.add(cube);

      torus = new THREE.Mesh(new THREE.TorusKnotGeometry(8, 3, 128, 16), material2);
      scene.add(torus);

      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      needToDispose(renderer, scene, controls, rgbeLoader);
    }

    function onWindowResized() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    function animate(msTime) {
      const time = msTime / 1000;

      cube.position.x = Math.cos(time) * 30;
      cube.position.y = Math.sin(time) * 30;
      cube.position.z = Math.sin(time) * 30;

      cube.rotation.x += 0.02;
      cube.rotation.y += 0.03;

      torus.position.x = Math.cos(time + 10) * 30;
      torus.position.y = Math.sin(time + 10) * 30;
      torus.position.z = Math.sin(time + 10) * 30;

      torus.rotation.x += 0.02;
      torus.rotation.y += 0.03;

      cubeCamera.update(renderer, scene);

      controls.update();

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
