import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_bvh',
  useLoaders: { BVHLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- BVH Loader' }
    ],
    [
      { tag: 'text', content: 'animation from' },
      { tag: 'a', link: 'http://mocap.cs.cmu.edu/', content: 'http://mocap.cs.cmu.edu/' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const clock = new THREE.Clock();

    let camera, controls, scene, renderer;
    let mixer;

    init();

    const loader = new BVHLoader();
    loader.load('models/bvh/pirouette.bvh', function (result) {
      const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);

      scene.add(result.skeleton.bones[0]);
      scene.add(skeletonHelper);

      // play animation
      mixer = new THREE.AnimationMixer(result.skeleton.bones[0]);
      mixer.clipAction(result.clip).play();
    });

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(0, 200, 300);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeeeeee);

      scene.add(new THREE.GridHelper(400, 10));

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 300;
      controls.maxDistance = 700;

      window.addEventListener('resize', onWindowResize);

      needToDispose(() => [renderer, scene, mixer, loader, controls]);
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
