import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass.js';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_masking',
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
        content: '- webgl masking postprocessing example'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, composer, renderer;
    let box, torus;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 10;

      const scene1 = new THREE.Scene();
      const scene2 = new THREE.Scene();

      box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));
      scene1.add(box);

      torus = new THREE.Mesh(new THREE.TorusGeometry(3, 1, 16, 32));
      scene2.add(torus);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setClearColor(0xe0e0e0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;
      //

      const clearPass = new ClearPass();

      const clearMaskPass = new ClearMaskPass();

      const maskPass1 = new MaskPass(scene1, camera);
      const maskPass2 = new MaskPass(scene2, camera);

      const texture1 = new THREE.TextureLoader().load(
        'textures/758px-Canestra_di_frutta_(Caravaggio).jpg'
      );
      texture1.colorSpace = THREE.SRGBColorSpace;
      texture1.minFilter = THREE.LinearFilter;
      const texture2 = new THREE.TextureLoader().load('textures/2294472375_24a3b8ef46_o.jpg');
      texture2.colorSpace = THREE.SRGBColorSpace;

      const texturePass1 = new TexturePass(texture1);
      const texturePass2 = new TexturePass(texture2);

      const outputPass = new OutputPass();

      const parameters = {
        stencilBuffer: true
      };

      const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        parameters
      );

      composer = new EffectComposer(renderer, renderTarget);
      composer.addPass(clearPass);
      composer.addPass(maskPass1);
      composer.addPass(texturePass1);
      composer.addPass(clearMaskPass);
      composer.addPass(maskPass2);
      composer.addPass(texturePass2);
      composer.addPass(clearMaskPass);
      composer.addPass(outputPass);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene1, scene2, composer);
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
      const time = Date.now() * 0.001 + 6000;

      box.position.x = Math.cos(time / 1.5) * 2;
      box.position.y = Math.sin(time) * 2;
      box.rotation.x = time;
      box.rotation.y = time / 2;

      torus.position.x = Math.cos(time) * 2;
      torus.position.y = Math.sin(time / 1.5) * 2;
      torus.rotation.x = time;
      torus.rotation.y = time / 2;

      renderer.clear();
      composer.render(time);
    }
  }
};
export { exampleInfo as default };
