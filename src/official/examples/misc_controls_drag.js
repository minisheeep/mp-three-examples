import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_controls_drag',
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
        content: 'webgl - drag controls'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Use "Shift+Click" to add/remove objects to/from a group.'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Use "M" to toggle between rotate and pan mode (touch only).'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Grouped objects can be transformed as a union.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    let controls, group;
    let enableSelection = false;

    const objects = [];

    const mouse = new THREE.Vector2(),
      raycaster = new THREE.Raycaster();

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
      camera.position.z = 25;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      scene.add(new THREE.AmbientLight(0xaaaaaa));

      const light = new THREE.SpotLight(0xffffff, 10000);
      light.position.set(0, 25, 50);
      light.angle = Math.PI / 9;

      light.castShadow = true;
      light.shadow.camera.near = 10;
      light.shadow.camera.far = 100;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;

      scene.add(light);

      group = new THREE.Group();
      scene.add(group);

      const geometry = new THREE.BoxGeometry();

      for (let i = 0; i < 200; i++) {
        const object = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
        );

        object.position.x = Math.random() * 30 - 15;
        object.position.y = Math.random() * 15 - 7.5;
        object.position.z = Math.random() * 20 - 10;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        object.castShadow = true;
        object.receiveShadow = true;

        scene.add(object);

        objects.push(object);
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      controls = new DragControls([...objects], camera, renderer.domElement);
      controls.rotateSpeed = 2;
      controls.addEventListener('drag', render);

      //
      window.addEventListener('resize', onWindowResize);
      canvas.addEventListener('click', onClick);

      render();

      const gui = new GUI();
      const state = {
        enableSelection: false,
        togglePanMode() {
          controls.touches.ONE =
            controls.touches.ONE === THREE.TOUCH.PAN ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
        }
      };
      gui
        .add(state, 'enableSelection')
        .name('group mode')
        .onChange((val) => {
          enableSelection = val;
        });
      gui.add(state, 'togglePanMode').name('toggle rotate/pan mode');

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function onClick(event) {
      event.preventDefault();

      if (enableSelection === true) {
        const draggableObjects = controls.objects;
        draggableObjects.length = 0;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersections = raycaster.intersectObjects(objects, true);

        if (intersections.length > 0) {
          const object = intersections[0].object;

          if (group.children.includes(object) === true) {
            object.material.emissive.set(0x000000);
            scene.attach(object);
          } else {
            object.material.emissive.set(0xaaaaaa);
            group.attach(object);
          }

          controls.transformGroup = true;
          draggableObjects.push(group);
        }

        if (group.children.length === 0) {
          controls.transformGroup = false;
          draggableObjects.push(...objects);
        }
      }

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
