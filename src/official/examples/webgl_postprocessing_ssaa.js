import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_ssaa',
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
        content: '- Unbiased Manual Supersamling Anti-Aliasing (SSAA) pass by'
      },
      {
        tag: 'a',
        link: 'https://clara.io',
        content: 'Ben Houston'
      }
    ],
    [
      {
        tag: 'text',
        content:
          'This example shows how to unbias the rounding errors accumulated using high number of SSAA samples on a 8-bit per channel buffer.'
      },
      {
        tag: 'text',
        content:
          'Turn off the "unbiased" feature to see the banding that results from accumulated rounding errors.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let scene, renderer, composer;
    let cameraP, ssaaRenderPassP;
    let cameraO, ssaaRenderPassO;
    let gui, stats;

    const params = {
      sampleLevel: 4,
      unbiased: true,
      camera: 'perspective',
      clearColor: 'black',
      clearAlpha: 1.0,
      viewOffsetX: 0,
      autoRotate: true
    };

    init();

    clearGui();

    function clearGui() {
      if (gui) gui.destroy();

      gui = new GUI();

      gui.add(params, 'unbiased');
      gui.add(params, 'sampleLevel', {
        'Level 0: 1 Sample': 0,
        'Level 1: 2 Samples': 1,
        'Level 2: 4 Samples': 2,
        'Level 3: 8 Samples': 3,
        'Level 4: 16 Samples': 4,
        'Level 5: 32 Samples': 5
      });
      gui.add(params, 'camera', ['perspective', 'orthographic']);
      gui.add(params, 'clearColor', ['black', 'white', 'blue', 'green', 'red']);
      gui.add(params, 'clearAlpha', 0, 1);
      gui.add(params, 'viewOffsetX', -100, 100);
      gui.add(params, 'autoRotate');

      gui.open();
    }

    function init() {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const aspect = width / height;
      const devicePixelRatio = window.devicePixelRatio || 1;

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(width, height);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      cameraP = new THREE.PerspectiveCamera(65, aspect, 3, 10);
      cameraP.position.z = 7;
      cameraP.setViewOffset(width, height, params.viewOffsetX, 0, width, height);

      cameraO = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 3, 10);
      cameraO.position.z = 7;

      const fov = THREE.MathUtils.degToRad(cameraP.fov);
      const hyperfocus = (cameraP.near + cameraP.far) / 2;
      const _height = 2 * Math.tan(fov / 2) * hyperfocus;
      cameraO.zoom = height / _height;

      scene = new THREE.Scene();

      const group = new THREE.Group();
      scene.add(group);

      const light = new THREE.PointLight(0xefffef, 500);
      light.position.z = 10;
      light.position.y = -10;
      light.position.x = -10;
      scene.add(light);

      const light2 = new THREE.PointLight(0xffefef, 500);
      light2.position.z = 10;
      light2.position.x = -10;
      light2.position.y = 10;
      scene.add(light2);

      const light3 = new THREE.PointLight(0xefefff, 500);
      light3.position.z = 10;
      light3.position.x = 10;
      light3.position.y = -10;
      scene.add(light3);

      const light4 = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(light4);

      const geometry = new THREE.SphereGeometry(3, 48, 24);

      for (let i = 0; i < 120; i++) {
        const material = new THREE.MeshStandardMaterial();
        material.roughness = 0.5 * Math.random() + 0.25;
        material.metalness = 0;
        material.color.setHSL(Math.random(), 1.0, 0.3);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 4 - 2;
        mesh.position.y = Math.random() * 4 - 2;
        mesh.position.z = Math.random() * 4 - 2;
        mesh.rotation.x = Math.random();
        mesh.rotation.y = Math.random();
        mesh.rotation.z = Math.random();

        mesh.scale.setScalar(Math.random() * 0.2 + 0.05);
        group.add(mesh);
      }

      // postprocessing

      composer = new EffectComposer(renderer);
      composer.setPixelRatio(1); // ensure pixel ratio is always 1 for performance reasons
      ssaaRenderPassP = new SSAARenderPass(scene, cameraP);
      composer.addPass(ssaaRenderPassP);
      ssaaRenderPassO = new SSAARenderPass(scene, cameraO);
      composer.addPass(ssaaRenderPassO);
      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, composer);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      cameraP.aspect = aspect;
      cameraP.setViewOffset(width, height, params.viewOffsetX, 0, width, height);
      cameraO.updateProjectionMatrix();

      cameraO.left = -height * aspect;
      cameraO.right = height * aspect;
      cameraO.top = height;
      cameraO.bottom = -height;
      cameraO.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    }

    function animate() {
      stats.begin();

      if (params.autoRotate) {
        for (let i = 0; i < scene.children.length; i++) {
          const child = scene.children[i];

          child.rotation.x += 0.005;
          child.rotation.y += 0.01;
        }
      }

      let newColor = ssaaRenderPassP.clearColor;

      switch (params.clearColor) {
        case 'blue':
          newColor = 0x0000ff;
          break;
        case 'red':
          newColor = 0xff0000;
          break;
        case 'green':
          newColor = 0x00ff00;
          break;
        case 'white':
          newColor = 0xffffff;
          break;
        case 'black':
          newColor = 0x000000;
          break;
      }

      ssaaRenderPassP.clearColor = ssaaRenderPassO.clearColor = newColor;
      ssaaRenderPassP.clearAlpha = ssaaRenderPassO.clearAlpha = params.clearAlpha;

      ssaaRenderPassP.sampleLevel = ssaaRenderPassO.sampleLevel = params.sampleLevel;
      ssaaRenderPassP.unbiased = ssaaRenderPassO.unbiased = params.unbiased;

      ssaaRenderPassP.enabled = params.camera === 'perspective';
      ssaaRenderPassO.enabled = params.camera === 'orthographic';

      cameraP.view.offsetX = params.viewOffsetX;

      composer.render();

      stats.end();
      stats.update();
    }
  }
};
export { exampleInfo as default };
