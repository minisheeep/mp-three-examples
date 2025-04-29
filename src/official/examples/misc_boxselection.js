import * as THREE from 'three';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
// import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_boxselection',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - box selection'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let camera, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
      camera.position.z = 50;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      scene.add(new THREE.AmbientLight(0xaaaaaa));

      const light = new THREE.SpotLight(0xffffff, 10000);
      light.position.set(0, 25, 50);
      light.angle = Math.PI / 5;

      light.castShadow = true;
      light.shadow.camera.near = 10;
      light.shadow.camera.far = 100;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;

      scene.add(light);

      const geometry = new THREE.BoxGeometry();

      for (let i = 0; i < 200; i++) {
        const object = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
        );

        object.position.x = Math.random() * 80 - 40;
        object.position.y = Math.random() * 45 - 25;
        object.position.z = Math.random() * 45 - 25;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        object.castShadow = true;
        object.receiveShadow = true;

        scene.add(object);
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      renderer.render(scene, camera);

      stats.update();
    }

    const selectionBox = new SelectionBox(camera, scene);
    // const helper = new SelectionHelper(renderer, 'selectBox');

    canvas.addEventListener('pointerdown', function (event) {
      for (const item of selectionBox.collection) {
        item.material.emissive.set(0x000000);
      }

      selectionBox.startPoint.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
      );
    });

    canvas.addEventListener('pointermove', function (event) {
      // if (helper.isDown) {
      for (let i = 0; i < selectionBox.collection.length; i++) {
        selectionBox.collection[i].material.emissive.set(0x000000);
      }

      selectionBox.endPoint.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
      );

      const allSelected = selectionBox.select();

      for (let i = 0; i < allSelected.length; i++) {
        allSelected[i].material.emissive.set(0xffffff);
      }
      // }
    });

    canvas.addEventListener('pointerup', function (event) {
      selectionBox.endPoint.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
      );

      const allSelected = selectionBox.select();

      for (let i = 0; i < allSelected.length; i++) {
        allSelected[i].material.emissive.set(0xffffff);
      }
    });
  }
};
export { exampleInfo as default };
