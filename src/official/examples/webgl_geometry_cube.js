import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_geometry_cube',
  useLoaders: {},
  info: [],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    let mesh;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 2;

      scene = new THREE.Scene();

      const texture = new THREE.TextureLoader().load('textures/crate.gif');
      texture.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ map: texture });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
