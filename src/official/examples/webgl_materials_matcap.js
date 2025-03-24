import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_matcap',
  useLoaders: [GLTFLoader, EXRLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl materials matcap' }
    ],
    [{ tag: 'text', content: 'Drag-and-drop JPG, PNG, WebP, AVIF, or EXR MatCap image files' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let mesh, renderer, scene, camera;

    const API = {
      color: 0xffffff, // sRGB
      exposure: 1.0,
      file: ''
    };

    init();

    function init() {
      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // tone mapping
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = API.exposure;

      // scene
      scene = new THREE.Scene();

      // camera
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
      camera.position.set(0, 0, 13);

      // controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.enableZoom = false;
      controls.enablePan = false;

      // matcap
      const loaderEXR = new EXRLoader();
      const matcap = loaderEXR.load('textures/matcaps/040full.exr', render);

      // normalmap
      const loader = new THREE.TextureLoader();

      const normalmap = loader.load(
        'models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg',
        render
      );

      // model
      new GLTFLoader().load('models/gltf/LeePerrySmith/LeePerrySmith.glb', function (gltf) {
        mesh = gltf.scene.children[0];
        mesh.position.y = -0.25;

        mesh.material = new THREE.MeshMatcapMaterial({
          color: new THREE.Color().setHex(API.color),
          matcap: matcap,
          normalMap: normalmap
        });

        scene.add(mesh);

        render();
      });

      // gui
      const gui = new GUI();

      gui
        .addColor(API, 'color')
        .listen()
        .onChange(function () {
          mesh.material.color.set(API.color);
          render();
        });

      gui.add(API, 'exposure', 0, 2).onChange(function () {
        renderer.toneMappingExposure = API.exposure;
        render();
      });

      gui
        .add(API, 'file', {
          none: '',
          spruit_sunrise: 'textures/equirectangular/spruit_sunrise_2k.hdr.jpg',
          piz: 'textures/piz_compressed.exr',
          depthmap: 'textures/kandao3_depthmap.jpg'
        })
        .name('file')
        .onChange(function (value) {
          value && loadFile(value);
        });

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

    //
    // drag and drop anywhere in document
    //

    function updateMatcap(texture) {
      if (mesh.material.matcap) {
        mesh.material.matcap.dispose();
      }

      mesh.material.matcap = texture;

      texture.needsUpdate = true;

      mesh.material.needsUpdate = true; // because the color space can change

      render();
    }

    function loadFile(filename) {
      const extension = filename.split('.').pop().toLowerCase();

      if (extension === 'exr') {
        const loaderEXR = new EXRLoader();
        loaderEXR.load(filename, updateMatcap);
      } else {
        const loader = new THREE.TextureLoader();
        loader.load(filename, updateMatcap);
      }
    }
  }
};
export { exampleInfo as default };
