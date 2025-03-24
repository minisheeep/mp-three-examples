import * as THREE from 'three';
import { MDDLoader } from 'three/examples/jsm/loaders/MDDLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_mdd',
  useLoaders: [MDDLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- MDDLoader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, mixer, clock;

    init();

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(8, 8, 8);
      camera.lookAt(scene.position);

      clock = new THREE.Clock();

      //

      const loader = new MDDLoader();
      loader.load('models/mdd/cube.mdd', function (result) {
        const morphTargets = result.morphTargets;
        const clip = result.clip;
        // clip.optimize(); // optional

        const geometry = new THREE.BoxGeometry();
        geometry.morphAttributes.position = morphTargets; // apply morph targets

        const material = new THREE.MeshNormalMaterial();

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(clip).play(); // use clip
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      window.addEventListener('resize', onWindowResize);

      needToDispose(() => [renderer, scene, loader, mixer]);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const delta = clock.getDelta();

      if (mixer) mixer.update(delta);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
