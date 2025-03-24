import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_lightprobe',
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
        content: 'webgl - light probe'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let mesh, renderer, scene, camera;

    let gui;

    let lightProbe;
    let directionalLight;

    // linear color space
    const API = {
      lightProbeIntensity: 1.0,
      directionalLightIntensity: 0.6,
      envMapIntensity: 1
    };

    init();

    function init() {
      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // tone mapping
      renderer.toneMapping = THREE.NoToneMapping;

      // scene
      scene = new THREE.Scene();

      // camera
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.set(0, 0, 30);

      // controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.minDistance = 10;
      controls.maxDistance = 50;
      controls.enablePan = false;

      // probe
      lightProbe = new THREE.LightProbe();
      scene.add(lightProbe);

      // light
      directionalLight = new THREE.DirectionalLight(0xffffff, API.directionalLightIntensity);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

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

      new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
        scene.background = cubeTexture;

        lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture));

        const geometry = new THREE.SphereGeometry(5, 64, 32);
        //const geometry = new THREE.TorusKnotGeometry( 4, 1.5, 256, 32, 2, 3 );

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0,
          roughness: 0,
          envMap: cubeTexture,
          envMapIntensity: API.envMapIntensity
        });

        // mesh
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        render();
      });

      // gui
      gui = new GUI({ title: 'Intensity' });

      gui
        .add(API, 'lightProbeIntensity', 0, 1, 0.02)
        .name('light probe')
        .onChange(function () {
          lightProbe.intensity = API.lightProbeIntensity;
          render();
        });

      gui
        .add(API, 'directionalLightIntensity', 0, 1, 0.02)
        .name('directional light')
        .onChange(function () {
          directionalLight.intensity = API.directionalLightIntensity;
          render();
        });

      gui
        .add(API, 'envMapIntensity', 0, 1, 0.02)
        .name('envMap')
        .onChange(function () {
          mesh.material.envMapIntensity = API.envMapIntensity;
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
