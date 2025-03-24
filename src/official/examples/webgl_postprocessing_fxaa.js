import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_fxaa',
  useLoaders: [],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- postprocessing - FXAA'
      },
      {
        tag: 'text',
        content: 'Left: No FXAA, Right: FXAA'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, clock, group;

    let composer1, composer2, fxaaPass;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 500;

      scene = new THREE.Scene();

      clock = new THREE.Clock();

      //

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d);
      hemiLight.position.set(0, 1000, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(-3000, 1000, -1000);
      scene.add(dirLight);

      //

      group = new THREE.Group();

      const geometry = new THREE.TetrahedronGeometry(10);
      const material = new THREE.MeshStandardMaterial({ color: 0xf73232, flatShading: true });

      for (let i = 0; i < 100; i++) {
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = Math.random() * 500 - 250;
        mesh.position.y = Math.random() * 500 - 250;
        mesh.position.z = Math.random() * 500 - 250;

        mesh.scale.setScalar(Math.random() * 2 + 1);

        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = Math.random() * Math.PI;

        group.add(mesh);
      }

      scene.add(group);

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;
      //

      const renderPass = new RenderPass(scene, camera);
      renderPass.clearAlpha = 0;

      //

      fxaaPass = new ShaderPass(FXAAShader);

      const outputPass = new OutputPass();

      composer1 = new EffectComposer(renderer);
      composer1.addPass(renderPass);
      composer1.addPass(outputPass);

      //

      const pixelRatio = renderer.getPixelRatio();

      fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
      fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

      composer2 = new EffectComposer(renderer);
      composer2.addPass(renderPass);
      composer2.addPass(outputPass);

      // FXAA is engineered to be applied towards the end of engine post processing after conversion to low dynamic range and conversion to the sRGB color space for display.

      composer2.addPass(fxaaPass);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, composer1, composer2);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer1.setSize(window.innerWidth, window.innerHeight);
      composer2.setSize(window.innerWidth, window.innerHeight);

      const pixelRatio = renderer.getPixelRatio();

      fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
      fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    }

    function animate() {
      const halfWidth = window.innerWidth / 2;

      group.rotation.y += clock.getDelta() * 0.1;

      renderer.setScissorTest(true);

      renderer.setScissor(0, 0, halfWidth - 1, window.innerHeight);
      composer1.render();

      renderer.setScissor(halfWidth, 0, halfWidth, window.innerHeight);
      composer2.render();

      renderer.setScissorTest(false);
    }
  }
};
export { exampleInfo as default };
