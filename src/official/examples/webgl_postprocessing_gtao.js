import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_gtao',
  useLoaders: [GLTFLoader, DRACOLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Ground Truth Ambient Occlusion (GTAO) by'
      },
      {
        tag: 'a',
        link: 'https://github.com/Rabbid76',
        content: 'Rabbid76'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    let camera, scene, renderer, composer, controls, clock, stats, mixer;

    init();

    function init() {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DecoderPath.STANDARD);
      // dracoLoader.setDecoderConfig({ type: 'js' });
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.setPath('models/gltf/');

      clock = new THREE.Clock();

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbfe3dd);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
      camera.position.set(5, 2, 8);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.5, 0);
      controls.update();
      controls.enablePan = false;
      controls.enableDamping = true;

      const width = window.innerWidth;
      const height = window.innerHeight;

      composer = new EffectComposer(renderer);

      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const gtaoPass = new GTAOPass(scene, camera, width, height);
      gtaoPass.output = GTAOPass.OUTPUT.Denoise;
      composer.addPass(gtaoPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      //

      loader.load(
        'LittlestTokyo.glb',
        (gltf) => {
          const model = gltf.scene;
          model.position.set(1, 1, 0);
          model.scale.set(0.01, 0.01, 0.01);
          scene.add(model);

          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();

          const box = new THREE.Box3().setFromObject(scene);
          gtaoPass.setSceneClipBox(box);
        },
        undefined,
        (e) => console.error(e)
      );

      // Init gui
      const gui = new GUI();

      gui
        .add(gtaoPass, 'output', {
          Default: GTAOPass.OUTPUT.Default,
          Diffuse: GTAOPass.OUTPUT.Diffuse,
          'AO Only': GTAOPass.OUTPUT.AO,
          'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
          Depth: GTAOPass.OUTPUT.Depth,
          Normal: GTAOPass.OUTPUT.Normal
        })
        .onChange(function (value) {
          gtaoPass.output = value;
        });

      const aoParameters = {
        radius: 0.25,
        distanceExponent: 1,
        thickness: 1,
        scale: 1,
        samples: 16,
        distanceFallOff: 1,
        screenSpaceRadius: false
      };
      const pdParameters = {
        lumaPhi: 10,
        depthPhi: 2,
        normalPhi: 3,
        radius: 4,
        radiusExponent: 1,
        rings: 2,
        samples: 16
      };
      gtaoPass.updateGtaoMaterial(aoParameters);
      gtaoPass.updatePdMaterial(pdParameters);
      gui.add(gtaoPass, 'blendIntensity').min(0).max(1).step(0.01);
      gui
        .add(aoParameters, 'radius')
        .min(0.01)
        .max(1)
        .step(0.01)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'distanceExponent')
        .min(1)
        .max(4)
        .step(0.01)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'thickness')
        .min(0.01)
        .max(10)
        .step(0.01)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'distanceFallOff')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'scale')
        .min(0.01)
        .max(2.0)
        .step(0.01)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'samples')
        .min(2)
        .max(32)
        .step(1)
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(aoParameters, 'screenSpaceRadius')
        .onChange(() => gtaoPass.updateGtaoMaterial(aoParameters));
      gui
        .add(pdParameters, 'lumaPhi')
        .min(0)
        .max(20)
        .step(0.01)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'depthPhi')
        .min(0.01)
        .max(20)
        .step(0.01)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'normalPhi')
        .min(0.01)
        .max(20)
        .step(0.01)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'radius')
        .min(0)
        .max(32)
        .step(1)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'radiusExponent')
        .min(0.1)
        .max(4)
        .step(0.1)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'rings')
        .min(1)
        .max(16)
        .step(0.125)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));
      gui
        .add(pdParameters, 'samples')
        .min(2)
        .max(32)
        .step(1)
        .onChange(() => gtaoPass.updatePdMaterial(pdParameters));

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, loader, dracoLoader, composer);
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
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      controls.update();

      stats.begin();
      composer.render();
      stats.end();
      stats.update();
    }
  }
};
export { exampleInfo as default };
