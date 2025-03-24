import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_smaa',
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
        content: '- post-processing SMAA'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, composer, stats, smaaPass;

    const params = {
      enabled: true,
      autoRotate: true
    };

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      //

      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 300;

      scene = new THREE.Scene();

      const geometry = new THREE.BoxGeometry(120, 120, 120);
      const material1 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

      const mesh1 = new THREE.Mesh(geometry, material1);
      mesh1.position.x = -100;
      scene.add(mesh1);

      const texture = new THREE.TextureLoader().load('textures/brick_diffuse.jpg');
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.colorSpace = THREE.SRGBColorSpace;

      const material2 = new THREE.MeshBasicMaterial({ map: texture });

      const mesh2 = new THREE.Mesh(geometry, material2);
      mesh2.position.x = 100;
      scene.add(mesh2);

      // postprocessing

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      smaaPass = new SMAAPass(
        window.innerWidth * renderer.getPixelRatio(),
        window.innerHeight * renderer.getPixelRatio()
      );
      composer.addPass(smaaPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      const smaaFolder = gui.addFolder('SMAA');
      smaaFolder.add(params, 'enabled');

      const sceneFolder = gui.addFolder('Scene');
      sceneFolder.add(params, 'autoRotate');

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

      if (params.autoRotate === true) {
        for (let i = 0; i < scene.children.length; i++) {
          const child = scene.children[i];

          child.rotation.x += 0.005;
          child.rotation.y += 0.01;
        }
      }

      smaaPass.enabled = params.enabled;

      composer.render();

      stats.end();
      stats.update();
    }
  }
};
export { exampleInfo as default };
