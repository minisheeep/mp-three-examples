import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_instancing_dynamic',
  useLoaders: {},
  info: [],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats, gui;

    let mesh;
    const amount = 20;
    const dummy = new THREE.Object3D();

    init();

    function init() {
      const count = Math.pow(amount, 3);
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(amount * 0.9, amount * 0.9, amount * 0.9);
      camera.lookAt(0, 0, 0);

      scene = new THREE.Scene();

      const loader = new THREE.BufferGeometryLoader();
      loader.load('models/json/suzanne_buffergeometry.json', function (geometry) {
        geometry.computeVertexNormals();
        geometry.scale(0.5, 0.5, 0.5);

        const material = new THREE.MeshNormalMaterial();
        // check overdraw
        // let material = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.1, transparent: true } );

        mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
        scene.add(mesh);

        //
        gui = new GUI();
        gui.add(mesh, 'count', 0, count);
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      stats = new Stats(renderer);

      //

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
      render();

      stats.update();
    }

    function render() {
      if (mesh) {
        const time = Date.now() * 0.001;

        mesh.rotation.x = Math.sin(time / 4);
        mesh.rotation.y = Math.sin(time / 2);

        let i = 0;
        const offset = (amount - 1) / 2;

        for (let x = 0; x < amount; x++) {
          for (let y = 0; y < amount; y++) {
            for (let z = 0; z < amount; z++) {
              dummy.position.set(offset - x, offset - y, offset - z);
              dummy.rotation.y =
                Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time);
              dummy.rotation.z = dummy.rotation.y * 2;

              dummy.updateMatrix();

              mesh.setMatrixAt(i++, dummy.matrix);
            }
          }
        }

        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
