import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { RGBMLoader } from 'three/examples/jsm/loaders/RGBMLoader.js';
import { DebugEnvironment } from 'three/examples/jsm/environments/DebugEnvironment.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_envmaps_hdr',
  useLoaders: { HDRCubeTextureLoader, RGBMLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- High dynamic range (RGBE) Image-based Lighting (IBL)'
      }
    ],
    [
      {
        tag: 'text',
        content: 'using run-time generated pre-filtered roughness mipmaps (PMREM)'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Created by Prashant Sharma and'
      },
      {
        tag: 'a',
        link: 'http://clara.io/',
        content: 'Ben Houston'
      },
      {
        tag: 'text',
        content: '.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const params = {
      envMap: 'HDR',
      roughness: 0.0,
      metalness: 0.0,
      exposure: 1.0,
      debug: false
    };

    let stats;
    let camera, scene, renderer, controls;
    let torusMesh, planeMesh;
    let generatedCubeRenderTarget, ldrCubeRenderTarget, hdrCubeRenderTarget, rgbmCubeRenderTarget;
    let ldrCubeMap, hdrCubeMap, rgbmCubeMap;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(0, 0, 120);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      //

      let geometry = new THREE.TorusKnotGeometry(18, 8, 150, 20);
      // let geometry = new THREE.SphereGeometry( 26, 64, 32 );
      let material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: params.metalness,
        roughness: params.roughness
      });

      torusMesh = new THREE.Mesh(geometry, material);
      scene.add(torusMesh);

      geometry = new THREE.PlaneGeometry(200, 200);
      material = new THREE.MeshBasicMaterial();

      planeMesh = new THREE.Mesh(geometry, material);
      planeMesh.position.y = -50;
      planeMesh.rotation.x = -Math.PI * 0.5;
      scene.add(planeMesh);

      THREE.DefaultLoadingManager.onLoad = function () {
        pmremGenerator.dispose();
      };

      const hdrUrls = ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];
      hdrCubeMap = new HDRCubeTextureLoader()
        .setPath('./textures/cube/pisaHDR/')
        .load(hdrUrls, function () {
          hdrCubeRenderTarget = pmremGenerator.fromCubemap(hdrCubeMap);

          hdrCubeMap.magFilter = THREE.LinearFilter;
          hdrCubeMap.needsUpdate = true;
        });

      const ldrUrls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
      ldrCubeMap = new THREE.CubeTextureLoader()
        .setPath('./textures/cube/pisa/')
        .load(ldrUrls, function () {
          ldrCubeRenderTarget = pmremGenerator.fromCubemap(ldrCubeMap);
        });

      const rgbmUrls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
      rgbmCubeMap = new RGBMLoader()
        .setMaxRange(16)
        .setPath('./textures/cube/pisaRGBM16/')
        .loadCubemap(rgbmUrls, function () {
          rgbmCubeRenderTarget = pmremGenerator.fromCubemap(rgbmCubeMap);
        });

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileCubemapShader();

      const envScene = new DebugEnvironment();
      generatedCubeRenderTarget = pmremGenerator.fromScene(envScene);

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //renderer.toneMapping = ReinhardToneMapping;

      stats = new Stats(renderer);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 50;
      controls.maxDistance = 300;

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      gui.add(params, 'envMap', ['Generated', 'LDR', 'HDR', 'RGBM16']);
      gui.add(params, 'roughness', 0, 1, 0.01);
      gui.add(params, 'metalness', 0, 1, 0.01);
      gui.add(params, 'exposure', 0, 2, 0.01);
      gui.add(params, 'debug');
      gui.open();

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      torusMesh.material.roughness = params.roughness;
      torusMesh.material.metalness = params.metalness;

      let renderTarget, cubeMap;

      switch (params.envMap) {
        case 'Generated':
          renderTarget = generatedCubeRenderTarget;
          cubeMap = generatedCubeRenderTarget.texture;
          break;
        case 'LDR':
          renderTarget = ldrCubeRenderTarget;
          cubeMap = ldrCubeMap;
          break;
        case 'HDR':
          renderTarget = hdrCubeRenderTarget;
          cubeMap = hdrCubeMap;
          break;
        case 'RGBM16':
          renderTarget = rgbmCubeRenderTarget;
          cubeMap = rgbmCubeMap;
          break;
      }

      const newEnvMap = renderTarget ? renderTarget.texture : null;

      if (newEnvMap && newEnvMap !== torusMesh.material.envMap) {
        torusMesh.material.envMap = newEnvMap;
        torusMesh.material.needsUpdate = true;

        planeMesh.material.map = newEnvMap;
        planeMesh.material.needsUpdate = true;
      }

      torusMesh.rotation.y += 0.005;
      planeMesh.visible = params.debug;

      scene.background = cubeMap;
      renderer.toneMappingExposure = params.exposure;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
