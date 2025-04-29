import * as THREE from 'three';
import * as Curves from 'three/examples/jsm/curves/CurveExtras.js';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_geometries_parametric',
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
        content: 'webgl - parametric geometries'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.y = 400;

      scene = new THREE.Scene();

      //

      const ambientLight = new THREE.AmbientLight(0xcccccc, 1.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
      camera.add(pointLight);
      scene.add(camera);

      //

      const map = new THREE.TextureLoader().load('textures/uv_grid_opengl.jpg');
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 16;
      map.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide });

      //

      let geometry, object;

      geometry = new ParametricGeometry(ParametricGeometries.plane(100, 100), 10, 10);
      geometry.center();
      object = new THREE.Mesh(geometry, material);
      object.position.set(-200, 0, 200);
      scene.add(object);

      geometry = new ParametricGeometry(ParametricGeometries.klein, 20, 20);
      object = new THREE.Mesh(geometry, material);
      object.position.set(0, 0, 200);
      object.scale.multiplyScalar(5);
      scene.add(object);

      geometry = new ParametricGeometry(ParametricGeometries.mobius, 20, 20);
      object = new THREE.Mesh(geometry, material);
      object.position.set(200, 0, 200);
      object.scale.multiplyScalar(30);
      scene.add(object);

      //

      const GrannyKnot = new Curves.GrannyKnot();

      const torus = new ParametricGeometries.TorusKnotGeometry(50, 10, 50, 20, 2, 3);
      const sphere = new ParametricGeometries.SphereGeometry(50, 20, 10);
      const tube = new ParametricGeometries.TubeGeometry(GrannyKnot, 100, 3, 8, true);

      object = new THREE.Mesh(torus, material);
      object.position.set(-200, 0, -200);
      scene.add(object);

      object = new THREE.Mesh(sphere, material);
      object.position.set(0, 0, -200);
      scene.add(object);

      object = new THREE.Mesh(tube, material);
      object.position.set(200, 0, -200);
      object.scale.multiplyScalar(2);
      scene.add(object);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      const timer = Date.now() * 0.0001;

      camera.position.x = Math.cos(timer) * 800;
      camera.position.z = Math.sin(timer) * 800;

      camera.lookAt(scene.position);

      scene.traverse(function (object) {
        if (object.isMesh === true) {
          object.rotation.x = timer * 5;
          object.rotation.y = timer * 2.5;
        }
      });

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
