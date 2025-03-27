import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics.js';
import Ammo from 'three/examples/jsm/libs/ammo.wasm.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'physics_ammo_instancing',
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
        content: 'physics - ammo.js instancing'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;
    let physics, position;

    let boxes, spheres;
    globalThis['Ammo'] = Ammo.bind(
      {},
      {
        // 仅 web 环境需要这个，小程序会自动配置 wasm 地址
        locateFile(path) {
          return `https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/${path}`;
        }
      }
    );
    init();
    needToDispose({
      dispose() {
        globalThis['Ammo'] = null;
      }
    });

    async function init() {
      physics = await AmmoPhysics();
      position = new THREE.Vector3();

      //

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(-1, 1.5, 2);
      camera.lookAt(0, 0.5, 0);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x666666);

      const hemiLight = new THREE.HemisphereLight();
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(5, 5, 5);
      dirLight.castShadow = true;
      dirLight.shadow.camera.zoom = 2;
      scene.add(dirLight);

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(10, 5, 10),
        new THREE.ShadowMaterial({ color: 0x444444 })
      );
      floor.position.y = -2.5;
      floor.receiveShadow = true;
      floor.userData.physics = { mass: 0 };
      scene.add(floor);

      //

      const material = new THREE.MeshLambertMaterial();

      const matrix = new THREE.Matrix4();
      const color = new THREE.Color();

      // Boxes

      const geometryBox = new THREE.BoxGeometry(0.075, 0.075, 0.075);
      boxes = new THREE.InstancedMesh(geometryBox, material, 400);
      boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
      boxes.castShadow = true;
      boxes.receiveShadow = true;
      boxes.userData.physics = { mass: 1 };
      scene.add(boxes);

      for (let i = 0; i < boxes.count; i++) {
        matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
        boxes.setMatrixAt(i, matrix);
        boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
      }

      // Spheres

      const geometrySphere = new THREE.IcosahedronGeometry(0.05, 4);
      spheres = new THREE.InstancedMesh(geometrySphere, material, 400);
      spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
      spheres.castShadow = true;
      spheres.receiveShadow = true;
      spheres.userData.physics = { mass: 1 };
      scene.add(spheres);

      for (let i = 0; i < spheres.count; i++) {
        matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
        spheres.setMatrixAt(i, matrix);
        spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));
      }

      physics.addScene(scene);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      stats = new Stats(renderer);

      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.y = 0.5;
      controls.update();

      setInterval(() => {
        let index = Math.floor(Math.random() * boxes.count);

        position.set(0, Math.random() + 1, 0);
        physics.setMeshPosition(boxes, position, index);

        //

        index = Math.floor(Math.random() * spheres.count);

        position.set(0, Math.random() + 1, 0);
        physics.setMeshPosition(spheres, position, index);
      }, 1000 / 60);

      needToDispose(renderer, scene, controls);
    }

    function animate() {
      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
