import * as THREE from 'three';
import { PeppersGhostEffect } from 'three/examples/jsm/effects/PeppersGhostEffect.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_effects_peppersghost',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [
      {
        tag: 'a',
        link: 'https://en.wikipedia.org/wiki/Pepper%27s_ghost',
        content: 'peppers ghost effect'
      },
      { tag: 'text', content: 'demo' },
      {
        tag: 'a',
        link: 'http://www.instructables.com/id/Reflective-Prism/?ALLSTEPS',
        content: 'how to build the reflective prism'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, effect;
    let group;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);

      scene = new THREE.Scene();

      group = new THREE.Group();
      scene.add(group);

      // Cube

      const geometry = new THREE.BoxGeometry().toNonIndexed(); // ensure unique vertices for each triangle

      const position = geometry.attributes.position;
      const colors = [];
      const color = new THREE.Color();

      // generate for each side of the cube a different color

      for (let i = 0; i < position.count; i += 6) {
        color.setHex(Math.random() * 0xffffff);

        // first face

        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);

        // second face

        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }

      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.MeshBasicMaterial({ vertexColors: true });

      for (let i = 0; i < 10; i++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.random() * 2 - 1;
        cube.position.y = Math.random() * 2 - 1;
        cube.position.z = Math.random() * 2 - 1;
        cube.scale.multiplyScalar(Math.random() + 0.5);
        group.add(cube);
      }

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setAnimationLoop(animate);
      effect = new PeppersGhostEffect(renderer);
      effect.setSize(window.innerWidth, window.innerHeight);
      effect.cameraDistance = 5;

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      group.rotation.y += 0.01;

      effect.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
