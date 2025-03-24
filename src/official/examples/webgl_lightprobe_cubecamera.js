import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_lightprobe_cubecamera',
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
        content: 'webgl - light probe from cubeCamera'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera, cubeCamera;

    let lightProbe;

    init();

    function init() {
      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // scene
      scene = new THREE.Scene();

      // camera
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(0, 0, 30);

      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);

      cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);

      // controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.minDistance = 10;
      controls.maxDistance = 50;
      controls.enablePan = false;

      // probe
      lightProbe = new THREE.LightProbe();
      scene.add(lightProbe);

      // envmap
      const genCubeUrls = function (prefix, postfix) {
        return [
          prefix + 'px' + postfix,
          prefix + 'nx' + postfix,
          prefix + 'py' + postfix,
          prefix + 'ny' + postfix,
          prefix + 'pz' + postfix,
          prefix + 'nz' + postfix
        ];
      };

      const urls = genCubeUrls('textures/cube/pisa/', '.png');

      new THREE.CubeTextureLoader().load(urls, async function (cubeTexture) {
        scene.background = cubeTexture;

        cubeCamera.update(renderer, scene);

        const probe = LightProbeGenerator.fromCubeRenderTarget(renderer, cubeRenderTarget);
        if (probe instanceof Promise) {
          lightProbe.copy(await probe);
        } else {
          lightProbe.copy(probe);
        }

        scene.add(new LightProbeHelper(lightProbe, 5));

        render();
      });

      // listener
      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
