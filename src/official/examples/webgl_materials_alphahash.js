import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_alphahash',
  useLoaders: {},
  info: [],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls, stats, mesh, material;

    let composer, renderPass, taaRenderPass, outputPass;

    let needsUpdate = false;

    // const amount = parseInt( window.location.search.slice( 1 ) ) || 3;
    const amount = 5;
    const count = Math.pow(amount, 3);

    const color = new THREE.Color();

    const params = {
      alpha: 0.5,
      alphaHash: true,
      taa: true,
      sampleLevel: 2
    };

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(amount, amount, amount);
      camera.lookAt(0, 0, 0);

      scene = new THREE.Scene();

      const geometry = new THREE.IcosahedronGeometry(0.5, 3);

      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        alphaHash: params.alphaHash,
        opacity: params.alpha
      });

      mesh = new THREE.InstancedMesh(geometry, material, count);

      let i = 0;
      const offset = (amount - 1) / 2;

      const matrix = new THREE.Matrix4();

      for (let x = 0; x < amount; x++) {
        for (let y = 0; y < amount; y++) {
          for (let z = 0; z < amount; z++) {
            matrix.setPosition(offset - x, offset - y, offset - z);

            mesh.setMatrixAt(i, matrix);
            mesh.setColorAt(i, color.setHex(Math.random() * 0xffffff));

            i++;
          }
        }
      }

      scene.add(mesh);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene.environment = pmremGenerator.fromScene(environment).texture;
      environment.dispose();

      //

      composer = new EffectComposer(renderer);

      renderPass = new RenderPass(scene, camera);
      renderPass.enabled = false;

      taaRenderPass = new TAARenderPass(scene, camera);

      outputPass = new OutputPass();

      composer.addPass(renderPass);
      composer.addPass(taaRenderPass);
      composer.addPass(outputPass);

      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;

      controls.addEventListener('change', () => (needsUpdate = true));

      //

      const gui = new GUI();

      gui.add(params, 'alpha', 0, 1).onChange(onMaterialUpdate);
      gui.add(params, 'alphaHash').onChange(onMaterialUpdate);

      const taaFolder = gui.addFolder('Temporal Anti-Aliasing');

      taaFolder
        .add(params, 'taa')
        .name('enabled')
        .onChange(() => {
          renderPass.enabled = !params.taa;
          taaRenderPass.enabled = params.taa;

          sampleLevelCtrl.enable(params.taa);

          needsUpdate = true;
        });

      const sampleLevelCtrl = taaFolder
        .add(params, 'sampleLevel', 0, 6, 1)
        .onChange(() => (needsUpdate = true));

      //

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);

      needsUpdate = true;
    }

    function onMaterialUpdate() {
      material.opacity = params.alpha;
      material.alphaHash = params.alphaHash;
      material.transparent = !params.alphaHash;
      material.depthWrite = params.alphaHash;

      material.needsUpdate = true;
      needsUpdate = true;
    }

    function animate() {
      render();

      stats.update();
    }

    function render() {
      if (needsUpdate) {
        taaRenderPass.accumulate = false;
        taaRenderPass.sampleLevel = 0;

        needsUpdate = false;
      } else {
        taaRenderPass.accumulate = true;
        taaRenderPass.sampleLevel = params.sampleLevel;
      }

      composer.render();
    }
  }
};
export { exampleInfo as default };
