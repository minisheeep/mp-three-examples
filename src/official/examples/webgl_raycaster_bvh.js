import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
  MeshBVHHelper
} from 'three-mesh-bvh';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_raycaster_bvh',
  useLoaders: { FBXLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'raycaster -'
      },
      {
        tag: 'a',
        link: 'https://github.com/gkjohnson/three-mesh-bvh',
        content: 'three-mesh-bvh'
      }
    ],
    [
      {
        tag: 'text',
        content: 'See'
      },
      {
        tag: 'a',
        link: 'https://github.com/gkjohnson/three-mesh-bvh',
        content: 'main project repository'
      },
      {
        tag: 'text',
        content: 'for more information and examples on high performance spatial queries.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    // Add the extension functions
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;

    let stats;
    let camera, scene, renderer;
    let mesh, helper, bvh;
    let sphereInstance, lineSegments;

    // reusable variables
    const _raycaster = new THREE.Raycaster();
    const _position = new THREE.Vector3();
    const _quaternion = new THREE.Quaternion();
    const _scale = new THREE.Vector3(1, 1, 1);
    const _matrix = new THREE.Matrix4();
    const _axis = new THREE.Vector3();
    const MAX_RAYS = 3000;
    const RAY_COLOR = 0x444444;

    const params = {
      count: 150,
      firstHitOnly: true,
      useBVH: true,

      displayHelper: false,
      helperDepth: 10
    };

    init();

    function init() {
      // environment
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100);
      camera.position.z = 10;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeeeeee);

      const ambient = new THREE.HemisphereLight(0xffffff, 0x999999, 3);
      scene.add(ambient);

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      // raycast visualizations
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(MAX_RAYS * 2 * 3), 3)
      );
      lineSegments = new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color: RAY_COLOR,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        })
      );

      sphereInstance = new THREE.InstancedMesh(
        new THREE.SphereGeometry(),
        new THREE.MeshBasicMaterial({ color: RAY_COLOR }),
        2 * MAX_RAYS
      );
      sphereInstance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      sphereInstance.count = 0;

      scene.add(sphereInstance, lineSegments);

      // load the bunny
      const loader = new FBXLoader();
      loader.load('models/fbx/stanford-bunny.fbx', (object) => {
        mesh = object.children[0];

        const geometry = mesh.geometry;
        geometry.translate(0, 0.5 / 0.0075, 0);
        geometry.computeBoundsTree();
        bvh = geometry.boundsTree;

        if (!params.useBVH) {
          geometry.boundsTree = null;
        }

        scene.add(mesh);
        mesh.scale.setScalar(0.0075);

        helper = new MeshBVHHelper(mesh);
        helper.color.set(0xe91e63);
        scene.add(helper);
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 5;
      controls.maxDistance = 75;

      // set up gui
      const gui = new GUI();
      const rayFolder = gui.addFolder('Raycasting');
      rayFolder.add(params, 'count', 1, MAX_RAYS, 1);
      rayFolder.add(params, 'firstHitOnly');
      rayFolder.add(params, 'useBVH').onChange((v) => {
        mesh.geometry.boundsTree = v ? bvh : null;
      });

      const helperFolder = gui.addFolder('BVH Helper');
      helperFolder.add(params, 'displayHelper');
      helperFolder.add(params, 'helperDepth', 1, 20, 1).onChange((v) => {
        helper.depth = v;
        helper.update();
      });

      window.addEventListener('resize', onWindowResize);
      onWindowResize();

      initRays();

      needToDispose(renderer, scene, controls);
    }

    function initRays() {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      const matrix = new THREE.Matrix4();

      for (let i = 0; i < MAX_RAYS * 2; i++) {
        position.randomDirection().multiplyScalar(3.75);
        matrix.compose(position, quaternion, scale);
        sphereInstance.setMatrixAt(i, matrix);
      }
    }

    const startTime = Date.now();

    function updateRays() {
      if (!mesh) return;

      _raycaster.firstHitOnly = params.firstHitOnly;
      const rayCount = params.count;

      let lineNum = 0;
      for (let i = 0; i < rayCount; i++) {
        // get the current ray origin
        sphereInstance.getMatrixAt(i * 2, _matrix);
        _matrix.decompose(_position, _quaternion, _scale);

        // rotate it about the origin
        const offset = 1e-4 * (Date.now() - startTime);
        _axis
          .set(Math.sin(i * 100 + offset), Math.cos(-i * 10 + offset), Math.sin(i * 1 + offset))
          .normalize();
        _position.applyAxisAngle(_axis, 0.001);

        // update the position
        _scale.setScalar(0.02);
        _matrix.compose(_position, _quaternion, _scale);
        sphereInstance.setMatrixAt(i * 2, _matrix);

        // raycast
        _raycaster.ray.origin.copy(_position);
        _raycaster.ray.direction.copy(_position).multiplyScalar(-1).normalize();

        // update hits points and lines
        const hits = _raycaster.intersectObject(mesh);
        if (hits.length !== 0) {
          const hit = hits[0];
          const point = hit.point;
          _scale.setScalar(0.01);
          _matrix.compose(point, _quaternion, _scale);
          sphereInstance.setMatrixAt(i * 2 + 1, _matrix);

          lineSegments.geometry.attributes.position.setXYZ(
            lineNum++,
            _position.x,
            _position.y,
            _position.z
          );
          lineSegments.geometry.attributes.position.setXYZ(lineNum++, point.x, point.y, point.z);
        } else {
          sphereInstance.setMatrixAt(i * 2 + 1, _matrix);
          lineSegments.geometry.attributes.position.setXYZ(
            lineNum++,
            _position.x,
            _position.y,
            _position.z
          );
          lineSegments.geometry.attributes.position.setXYZ(lineNum++, 0, 0, 0);
        }
      }

      sphereInstance.count = rayCount * 2;
      sphereInstance.instanceMatrix.needsUpdate = true;

      lineSegments.geometry.setDrawRange(0, lineNum);
      lineSegments.geometry.attributes.position.needsUpdate = true;
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
      if (helper) {
        helper.visible = params.displayHelper;
      }

      if (mesh) {
        mesh.rotation.y += 0.002;
        mesh.updateMatrixWorld();
      }

      updateRays();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
