import * as THREE from 'three';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_effects_stereo',
  useLoaders: [],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- effects - stereo. skybox by' }
    ],
    [{ tag: 'a', link: 'http://www.zfight.com/', content: 'Jochum Skoglund' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, effect;

    const spheres = [];

    let mouseX = 0,
      mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    canvas.addEventListener('pointermove', onDocumentMouseMove);

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
      camera.position.z = 3200;

      scene = new THREE.Scene();
      scene.background = new THREE.CubeTextureLoader()
        .setPath('textures/cube/Park3Med/')
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

      const geometry = new THREE.SphereGeometry(100, 32, 16);

      const textureCube = new THREE.CubeTextureLoader()
        .setPath('textures/cube/Park3Med/')
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
      textureCube.mapping = THREE.CubeRefractionMapping;

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: textureCube,
        refractionRatio: 0.95
      });

      for (let i = 0; i < 500; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 10000 - 5000;
        mesh.position.y = Math.random() * 10000 - 5000;
        mesh.position.z = Math.random() * 10000 - 5000;
        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
        scene.add(mesh);

        spheres.push(mesh);
      }

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setAnimationLoop(animate);
      effect = new StereoEffect(renderer);
      effect.setSize(window.innerWidth, window.innerHeight);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
      mouseX = (event.clientX - windowHalfX) * 10;
      mouseY = (event.clientY - windowHalfY) * 10;
    }

    //

    function animate() {
      const timer = 0.0001 * Date.now();

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      for (let i = 0, il = spheres.length; i < il; i++) {
        const sphere = spheres[i];

        sphere.position.x = 5000 * Math.cos(timer + i);
        sphere.position.y = 5000 * Math.sin(timer + i * 1.1);
      }

      effect.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
