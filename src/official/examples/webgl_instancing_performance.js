import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_instancing_performance',
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
        content: 'webgl - instancing - performance'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, gui;
    let camera, controls, scene, renderer, material;

    // gui

    const Method = {
      INSTANCED: 'INSTANCED',
      MERGED: 'MERGED',
      NAIVE: 'NAIVE'
    };

    const api = {
      method: Method.INSTANCED,
      count: 1000,
      drawCalls: '-',
      memory: '-'
    };

    //

    init();
    initMesh();

    //

    function clean() {
      const meshes = [];

      scene.traverse(function (object) {
        if (object.isMesh) meshes.push(object);
      });

      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        mesh.material.dispose();
        mesh.geometry.dispose();

        scene.remove(mesh);
      }
    }

    const randomizeMatrix = (function () {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      return function (matrix) {
        position.x = Math.random() * 40 - 20;
        position.y = Math.random() * 40 - 20;
        position.z = Math.random() * 40 - 20;

        quaternion.random();

        scale.x = scale.y = scale.z = Math.random() * 1;

        matrix.compose(position, quaternion, scale);
      };
    })();

    function initMesh() {
      clean();

      // make instances
      new THREE.BufferGeometryLoader()
        .setPath('models/json/')
        .load('suzanne_buffergeometry.json', function (geometry) {
          material = new THREE.MeshNormalMaterial();

          geometry.computeVertexNormals();

          console.time(api.method + ' (build)');

          switch (api.method) {
            case Method.INSTANCED:
              makeInstanced(geometry);
              break;

            case Method.MERGED:
              makeMerged(geometry);
              break;

            case Method.NAIVE:
              makeNaive(geometry);
              break;
          }

          console.timeEnd(api.method + ' (build)');
        });
    }

    function makeInstanced(geometry) {
      const matrix = new THREE.Matrix4();
      const mesh = new THREE.InstancedMesh(geometry, material, api.count);

      for (let i = 0; i < api.count; i++) {
        randomizeMatrix(matrix);
        mesh.setMatrixAt(i, matrix);
      }

      scene.add(mesh);

      //

      const geometryByteLength = getGeometryByteLength(geometry);

      api.drawCalls = '1';
      api.memory = formatBytes(api.count * 16 + geometryByteLength, 2);
    }

    function makeMerged(geometry) {
      const geometries = [];
      const matrix = new THREE.Matrix4();

      for (let i = 0; i < api.count; i++) {
        randomizeMatrix(matrix);

        const instanceGeometry = geometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        geometries.push(instanceGeometry);
      }

      const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

      scene.add(new THREE.Mesh(mergedGeometry, material));

      //

      api.drawCalls = '1';
      api.memory = formatBytes(getGeometryByteLength(mergedGeometry), 2);
    }

    function makeNaive(geometry) {
      const matrix = new THREE.Matrix4();

      for (let i = 0; i < api.count; i++) {
        randomizeMatrix(matrix);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(matrix);

        scene.add(mesh);
      }

      //

      const geometryByteLength = getGeometryByteLength(geometry);

      api.drawCalls = `${api.count}`;
      api.memory = formatBytes(api.count * 16 + geometryByteLength, 2);
    }

    function init() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // camera

      camera = new THREE.PerspectiveCamera(70, width / height, 1, 100);
      camera.position.z = 30;

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.setAnimationLoop(animate);
      // scene

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      // controls

      controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;

      // stats

      stats = new Stats(renderer);

      // gui

      gui = new GUI();
      gui.add(api, 'method', Method);
      gui.add(api, 'count', 1, 10000).step(1);
      gui.add(
        {
          apply() {
            initMesh();
          }
        },
        'apply'
      );

      const perfFolder = gui.addFolder('Performance');

      const c1 = perfFolder.add(api, 'drawCalls').name('GPU draw calls').disable(true).listen();
      const c2 = perfFolder.add(api, 'memory').name('GPU memory').disable(true).listen();
      perfFolder.open();

      // listeners

      window.addEventListener('resize', onWindowResize);

      Object.assign(window, { scene });

      needToDispose(renderer, scene, controls, {
        dispose() {
          c1.listen(false);
          c2.listen(false);
        }
      });
    }

    //

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    function animate() {
      controls.update();

      renderer.render(scene, camera);

      stats.update();
    }

    //

    function getGeometryByteLength(geometry) {
      let total = 0;

      if (geometry.index) total += geometry.index.array.byteLength;

      for (const name in geometry.attributes) {
        total += geometry.attributes[name].array.byteLength;
      }

      return total;
    }

    // Source: https://stackoverflow.com/a/18650828/1314762
    function formatBytes(bytes, decimals) {
      if (bytes === 0) return '0 bytes';

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['bytes', 'KB', 'MB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
  }
};
export { exampleInfo as default };
