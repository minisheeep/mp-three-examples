import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_interactive_voxelpainter',
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
        content: '- voxel painter - webgl'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    let plane;
    let pointer,
      raycaster,
      isShiftDown = false;

    let rollOverMesh, rollOverMaterial;
    let cubeGeo, cubeMaterial;

    const objects = [];

    init();
    render();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.set(500, 800, 1300);
      camera.lookAt(0, 0, 0);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // roll-over helpers

      const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
      rollOverMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        transparent: true
      });
      rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
      scene.add(rollOverMesh);

      // cubes

      const map = new THREE.TextureLoader().load('textures/square-outline-textured.png');
      map.colorSpace = THREE.SRGBColorSpace;
      cubeGeo = new THREE.BoxGeometry(50, 50, 50);
      cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xfeb74c, map: map });

      // grid

      const gridHelper = new THREE.GridHelper(1000, 20);
      scene.add(gridHelper);

      //

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      const geometry = new THREE.PlaneGeometry(1000, 1000);
      geometry.rotateX(-Math.PI / 2);

      plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
      scene.add(plane);

      objects.push(plane);

      // lights

      const ambientLight = new THREE.AmbientLight(0x606060, 3);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(1, 0.75, 0.5).normalize();
      scene.add(directionalLight);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', (event) => {
        lastEvent = event;
      });

      //
      let lastEvent = null;
      const gui = new GUI();
      const actions = {
        addBox() {
          lastEvent && onPointerDown(lastEvent);
        },
        removeBox() {
          isShiftDown = true;
          lastEvent && onPointerDown(lastEvent);
          isShiftDown = false;
        }
      };
      gui.add(actions, 'addBox').name('add voxel');
      gui.add(actions, 'removeBox').name('remove voxel');

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function onPointerMove(event) {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(objects, false);

      if (intersects.length > 0) {
        const intersect = intersects[0];

        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

        render();
      }
    }

    function onPointerDown(event) {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(objects, false);

      if (intersects.length > 0) {
        const intersect = intersects[0];

        // delete cube

        if (isShiftDown) {
          if (intersect.object !== plane) {
            scene.remove(intersect.object);

            objects.splice(objects.indexOf(intersect.object), 1);
          }

          // create cube
        } else {
          const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
          voxel.position.copy(intersect.point).add(intersect.face.normal);
          voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
          scene.add(voxel);

          objects.push(voxel);
        }

        render();
      }
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
