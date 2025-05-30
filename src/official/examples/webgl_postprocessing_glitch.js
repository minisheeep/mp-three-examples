import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_glitch',
  useLoaders: {},
  initAfterConfirm: {
    type: 'warning',
    text: ['这个例子可能会引发', '光敏性癫痫患者的癫痫发作']
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
        content: '- webgl glitch postprocessing example'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, composer;
    let object, light;

    let glitchPass;

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 400;

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 1, 1000);

      object = new THREE.Object3D();
      scene.add(object);

      const geometry = new THREE.SphereGeometry(1, 4, 4);

      for (let i = 0; i < 100; i++) {
        const material = new THREE.MeshPhongMaterial({
          color: 0xffffff * Math.random(),
          flatShading: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize();
        mesh.position.multiplyScalar(Math.random() * 400);
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
        object.add(mesh);
      }

      scene.add(new THREE.AmbientLight(0xcccccc));

      light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(1, 1, 1);
      scene.add(light);

      // postprocessing

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      glitchPass = new GlitchPass();

      composer.addPass(glitchPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      //

      window.addEventListener('resize', onWindowResize);

      glitchPass.goWild = false;

      const gui = new GUI();
      gui.add(glitchPass, 'goWild').name('Glitch me wild');

      needToDispose(renderer, scene, composer);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      object.rotation.x += 0.005;
      object.rotation.y += 0.01;

      composer.render();
    }
    init();
  }
};
export { exampleInfo as default };
