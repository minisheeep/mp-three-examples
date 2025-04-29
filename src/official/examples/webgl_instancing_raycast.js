import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_instancing_raycast',
  useLoaders: {},
  info: [],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls, stats, gui;

    let mesh;
    const amount = 20;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(1, 1);

    const color = new THREE.Color();
    const white = new THREE.Color().setHex(0xffffff);

    init();

    function init() {
      const count = Math.pow(amount, 3);
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(amount, amount, amount);
      camera.lookAt(0, 0, 0);

      scene = new THREE.Scene();

      const light = new THREE.HemisphereLight(0xffffff, 0x888888, 3);
      light.position.set(0, 1, 0);
      scene.add(light);

      const geometry = new THREE.IcosahedronGeometry(0.5, 3);
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });

      mesh = new THREE.InstancedMesh(geometry, material, count);

      let i = 0;
      const offset = (amount - 1) / 2;

      const matrix = new THREE.Matrix4();

      for (let x = 0; x < amount; x++) {
        for (let y = 0; y < amount; y++) {
          for (let z = 0; z < amount; z++) {
            matrix.setPosition(offset - x, offset - y, offset - z);

            mesh.setMatrixAt(i, matrix);
            mesh.setColorAt(i, color);

            i++;
          }
        }
      }

      scene.add(mesh);

      gui = new GUI();
      gui.add(mesh, 'count', 0, count);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);
      canvas.addEventListener('pointermove', onMouseMove);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(event) {
      event.preventDefault();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function animate() {
      controls.update();

      raycaster.setFromCamera(mouse, camera);

      const intersection = raycaster.intersectObject(mesh);

      if (intersection.length > 0) {
        const instanceId = intersection[0].instanceId;

        mesh.getColorAt(instanceId, color);

        if (color.equals(white)) {
          mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff));

          mesh.instanceColor.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
