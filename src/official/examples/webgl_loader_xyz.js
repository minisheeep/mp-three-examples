import * as THREE from 'three';
import { XYZLoader } from 'three/examples/jsm/loaders/XYZLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_xyz',
  useLoaders: [XYZLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- XYZ loader' }
    ],
    [
      { tag: 'text', content: 'asset from' },
      {
        tag: 'a',
        link: 'https://people.math.sc.edu/Burkardt/data/xyz/xyz.html',
        content: 'people.math.sc.edu'
      },
      { tag: 'text', content: 'via GNU LGPL' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, clock;

    let points;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(10, 7, 10);

      scene = new THREE.Scene();
      scene.add(camera);
      camera.lookAt(scene.position);

      clock = new THREE.Clock();

      const loader = new XYZLoader();
      loader.load('models/xyz/helix_201.xyz', function (geometry) {
        geometry.center();

        const vertexColors = geometry.hasAttribute('color') === true;

        const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors });

        points = new THREE.Points(geometry, material);
        scene.add(points);
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const delta = clock.getDelta();

      if (points) {
        points.rotation.x += delta * 0.2;
        points.rotation.y += delta * 0.5;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
