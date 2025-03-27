import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_gltf_compressed',
  useLoaders: [KTX2Loader, GLTFLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- GLTFLoader + compression extensions' }
    ],
    [
      {
        tag: 'a',
        link: 'https://sketchfab.com/3d-models/coffeemat-7fb196a40a6e4697aad9ca2f75c8b33d',
        content: 'Coffeemat'
      },
      { tag: 'text', content: 'by' },
      { tag: 'a', link: 'https://sketchfab.com/OFFcours1', content: 'Roman Red' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose }) => {
    let camera, scene, renderer;

    init();
    render();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.set(0, 100, 0);

      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbbbbbb);
      scene.environment = pmremGenerator.fromScene(environment).texture;
      environment.dispose();

      const grid = new THREE.GridHelper(500, 10, 0xffffff, 0xffffff);
      grid.material.opacity = 0.5;
      grid.material.depthWrite = false;
      grid.material.transparent = true;
      scene.add(grid);

      const ktx2Loader = new KTX2Loader()
        .setWorkerLimit(1)
        .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/basis/')
        .detectSupport(renderer);

      const loader = new GLTFLoader();
      loader.setKTX2Loader(ktx2Loader);
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load('models/gltf/coffeemat.glb', function (gltf) {
        // coffeemat.glb was produced from the source scene using gltfpack:
        // gltfpack -i coffeemat/scene.gltf -o coffeemat.glb -cc -tc
        // The resulting model uses EXT_meshopt_compression (for geometry) and KHR_texture_basisu (for texture compression using ETC1S/BasisLZ)

        gltf.scene.position.y = 8;

        scene.add(gltf.scene);

        render();
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.minDistance = 400;
      controls.maxDistance = 1000;
      controls.target.set(10, 90, -16);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      needToDispose(scene, renderer, pmremGenerator, ktx2Loader, loader, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    //

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
