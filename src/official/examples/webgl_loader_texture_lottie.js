import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LottieLoader } from 'three/examples/jsm/loaders/LottieLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_lottie',
  useLoaders: [LottieLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - lottie'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera;
    let mesh;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
      camera.position.z = 2.5;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);

      const loader = new LottieLoader();
      loader.setQuality(2);
      loader.load('textures/lottie/24017-lottie-logo-animation.json', function (texture) {
        setupControls(texture.animation);

        const geometry = new RoundedBoxGeometry(1, 1, 1, 7, 0.2);
        const material = new THREE.MeshStandardMaterial({ roughness: 0.1, map: texture });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene.environment = pmremGenerator.fromScene(environment).texture;

      window.addEventListener('resize', onWindowResize);

      needToDispose(loader, renderer, scene, environment, pmremGenerator);
    }

    function setupControls(animation) {
      // Lottie animation API
      // https://airbnb.io/lottie/#/web
      console.log(animation);

      // const status = {
      //   frame: 0,
      // };
      // const gui = new GUI();
      // gui.add(status, 'frame', 0, animation.totalFrames).onChange(function (value) {
      //   console.log(value);
      // })
      //
      //
      // scrubber.addEventListener('pointerdown', function () {
      //   animation.pause()
      // })
      //
      // scrubber.addEventListener('pointerup', function () {
      //   animation.play()
      // })
      //
      // scrubber.addEventListener('input', function () {
      //   animation.goToAndStop(parseFloat(scrubber.value), true)
      // })
      //
      // animation.addEventListener('enterFrame', function () {
      //   scrubber.value = animation.currentFrame
      // })
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      if (mesh) {
        mesh.rotation.y -= 0.001;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
