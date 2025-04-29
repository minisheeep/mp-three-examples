import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_ssao',
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
        content: '- screen space ambient occlusion'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let camera, scene, renderer;
    let composer;
    let group;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 100, 700);
      camera.position.z = 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xaaaaaa);

      scene.add(new THREE.DirectionalLight(0xffffff, 4));
      scene.add(new THREE.AmbientLight(0xffffff));

      group = new THREE.Group();
      scene.add(group);

      const geometry = new THREE.BoxGeometry(10, 10, 10);

      for (let i = 0; i < 100; i++) {
        const material = new THREE.MeshLambertMaterial({
          color: Math.random() * 0xffffff
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 400 - 200;
        mesh.position.y = Math.random() * 400 - 200;
        mesh.position.z = Math.random() * 400 - 200;
        mesh.rotation.x = Math.random();
        mesh.rotation.y = Math.random();
        mesh.rotation.z = Math.random();

        mesh.scale.setScalar(Math.random() * 10 + 2);
        group.add(mesh);
      }

      stats = new Stats(renderer);

      const width = window.innerWidth;
      const height = window.innerHeight;

      composer = new EffectComposer(renderer);

      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const ssaoPass = new SSAOPass(scene, camera, width, height);
      composer.addPass(ssaoPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      // Init gui
      const gui = new GUI();

      gui
        .add(ssaoPass, 'output', {
          Default: SSAOPass.OUTPUT.Default,
          'SSAO Only': SSAOPass.OUTPUT.SSAO,
          'SSAO Only + Blur': SSAOPass.OUTPUT.Blur,
          Depth: SSAOPass.OUTPUT.Depth,
          Normal: SSAOPass.OUTPUT.Normal
        })
        .onChange(function (value) {
          ssaoPass.output = value;
        });
      gui.add(ssaoPass, 'kernelRadius').min(0).max(32);
      gui.add(ssaoPass, 'minDistance').min(0.001).max(0.02).step(0.001);
      gui.add(ssaoPass, 'maxDistance').min(0.01).max(0.3).step(0.01);
      gui.add(ssaoPass, 'enabled');

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, composer);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    }

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      const timer = Date.now();
      group.rotation.x = timer * 0.0002;
      group.rotation.y = timer * 0.0001;

      composer.render();
    }
  }
};
export { exampleInfo as default };
