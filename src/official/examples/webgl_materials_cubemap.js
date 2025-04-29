import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_cubemap',
  useLoaders: { OBJLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- cube mapping demo.' }
    ],
    [
      { tag: 'text', content: 'Texture by' },
      { tag: 'a', link: 'http://www.humus.name/index.php?page=Textures', content: 'Humus' },
      { tag: 'text', content: ', Walt Disney head by' },
      {
        tag: 'a',
        link: 'http://web.archive.org/web/20120903131400/http://davidoreilly.com/post/18087489343/disneyhead',
        content: 'David OReilly'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let container, stats;

    let camera, scene, renderer;

    let pointLight;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 13;

      //cubemap
      const path = 'textures/cube/SwedishRoyalCastle/';
      const format = '.jpg';
      const urls = [
        path + 'px' + format,
        path + 'nx' + format,
        path + 'py' + format,
        path + 'ny' + format,
        path + 'pz' + format,
        path + 'nz' + format
      ];

      const reflectionCube = new THREE.CubeTextureLoader().load(urls);
      const refractionCube = new THREE.CubeTextureLoader().load(urls);
      refractionCube.mapping = THREE.CubeRefractionMapping;

      scene = new THREE.Scene();
      scene.background = reflectionCube;

      //lights
      const ambient = new THREE.AmbientLight(0xffffff, 3);
      scene.add(ambient);

      pointLight = new THREE.PointLight(0xffffff, 200);
      scene.add(pointLight);

      //materials
      const cubeMaterial3 = new THREE.MeshLambertMaterial({
        color: 0xffaa00,
        envMap: reflectionCube,
        combine: THREE.MixOperation,
        reflectivity: 0.3
      });
      const cubeMaterial2 = new THREE.MeshLambertMaterial({
        color: 0xfff700,
        envMap: refractionCube,
        refractionRatio: 0.95
      });
      const cubeMaterial1 = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        envMap: reflectionCube
      });

      //models
      const objLoader = new OBJLoader();

      objLoader.setPath('models/obj/walt/');
      objLoader.load('WaltHead.obj', function (object) {
        const head = object.children[0];
        head.scale.setScalar(0.1);
        head.position.y = -3;
        head.material = cubeMaterial1;

        const head2 = head.clone();
        head2.position.x = -6;
        head2.material = cubeMaterial2;

        const head3 = head.clone();
        head3.position.x = 6;
        head3.material = cubeMaterial3;

        scene.add(head, head2, head3);
      });

      //renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 1.5;

      //stats
      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
      stats.update();
    }
  }
};
export { exampleInfo as default };
