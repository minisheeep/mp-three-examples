import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_draco',
  useLoaders: { DRACOLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [
      { tag: 'a', link: 'https://github.com/google/draco', content: 'DRACO' },
      { tag: 'text', content: 'loader' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    let camera, scene, renderer;

    // Configure and create Draco decoder.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DecoderPath.STANDARD);

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 15);
      camera.position.set(3, 0.25, 3);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x443333);
      scene.fog = new THREE.Fog(0x443333, 1, 4);

      // Ground
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, specular: 0x101010 })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.03;
      plane.receiveShadow = true;
      scene.add(plane);

      // Lights
      const hemiLight = new THREE.HemisphereLight(0x8d7c7c, 0x494966, 3);
      scene.add(hemiLight);

      const spotLight = new THREE.SpotLight();
      spotLight.intensity = 7;
      spotLight.angle = Math.PI / 16;
      spotLight.penumbra = 0.5;
      spotLight.castShadow = true;
      spotLight.position.set(-1, 1, 1);
      scene.add(spotLight);

      dracoLoader.load('models/draco/bunny.drc', function (geometry) {
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0xa5a5a5 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Release decoder resources.
        dracoLoader.dispose();
      });

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, dracoLoader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const timer = Date.now() * 0.0003;

      camera.position.x = Math.sin(timer) * 0.5;
      camera.position.z = Math.cos(timer) * 0.5;
      camera.lookAt(0, 0.1, 0);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
