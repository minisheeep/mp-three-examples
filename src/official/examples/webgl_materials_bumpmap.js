import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_bumpmap',
  useLoaders: { GLTFLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- bump mapping without tangents' }
    ],
    [
      { tag: 'a', link: 'https://casual-effects.com/data/', content: 'Lee Perry-Smith' },
      { tag: 'text', content: 'head' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, loader;

    let camera, scene, renderer;

    let mesh;

    let spotLight;

    let mouseX = 0;
    let mouseY = 0;

    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    init();

    function init() {
      //

      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 12;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060708);

      // LIGHTS

      scene.add(new THREE.HemisphereLight(0x8d7c7c, 0x494966, 3));

      spotLight = new THREE.SpotLight(0xffffde, 200);
      spotLight.position.set(3.5, 0, 7);
      scene.add(spotLight);

      spotLight.castShadow = true;

      spotLight.shadow.mapSize.width = 2048;
      spotLight.shadow.mapSize.height = 2048;

      spotLight.shadow.camera.near = 2;
      spotLight.shadow.camera.far = 15;

      spotLight.shadow.camera.fov = 40;

      spotLight.shadow.bias = -0.005;

      //

      const mapHeight = new THREE.TextureLoader().load(
        'models/gltf/LeePerrySmith/Infinite-Level_02_Disp_NoSmoothUV-4096.jpg'
      );

      const material = new THREE.MeshPhongMaterial({
        color: 0x9c6e49,
        specular: 0x666666,
        shininess: 25,
        bumpMap: mapHeight,
        bumpScale: 10
      });

      loader = new GLTFLoader();
      loader.load('models/gltf/LeePerrySmith/LeePerrySmith.glb', function (gltf) {
        createScene(gltf.scene.children[0].geometry, 1, material);
      });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;

      //

      stats = new Stats(renderer);

      // EVENTS

      canvas.addEventListener('pointermove', onDocumentMouseMove);
      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function createScene(geometry, scale, material) {
      mesh = new THREE.Mesh(geometry, material);

      mesh.position.y = -0.5;
      mesh.scale.set(scale, scale, scale);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
    }

    //

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    //

    function animate() {
      render();

      stats.update();
    }

    function render() {
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      if (mesh) {
        mesh.rotation.y += 0.05 * (targetX - mesh.rotation.y);
        mesh.rotation.x += 0.05 * (targetY - mesh.rotation.x);
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
