import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_simple_gi',
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
        content: '- simple global illumination ('
      },
      {
        tag: 'a',
        link: 'http://www.iquilezles.org/www/articles/simplegi/simplegi.htm',
        content: 'article'
      },
      {
        tag: 'text',
        content: ')'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    class GIMesh extends THREE.Mesh {
      copy(source) {
        super.copy(source);

        this.geometry = source.geometry.clone();

        return this;
      }
    }

    //

    const SimpleGI = function (renderer, scene) {
      const SIZE = 32,
        SIZE2 = SIZE * SIZE;

      const camera = new THREE.PerspectiveCamera(90, 1, 0.01, 100);

      scene.updateMatrixWorld(true);

      let clone = scene.clone();
      clone.matrixWorldAutoUpdate = false;

      const rt = new THREE.WebGLRenderTarget(SIZE, SIZE);

      const normalMatrix = new THREE.Matrix3();

      const position = new THREE.Vector3();
      const normal = new THREE.Vector3();

      let bounces = 0;
      let currentVertex = 0;

      const color = new Float32Array(3);
      const buffer = new Uint8Array(SIZE2 * 4);

      function compute() {
        if (bounces === 3) return;

        const object = scene.children[0]; // torusKnot
        const geometry = object.geometry;

        const attributes = geometry.attributes;
        const positions = attributes.position.array;
        const normals = attributes.normal.array;

        if (attributes.color === undefined) {
          const colors = new Float32Array(positions.length);
          geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
          );
        }

        const colors = attributes.color.array;

        const startVertex = currentVertex;
        const totalVertex = positions.length / 3;

        for (let i = 0; i < 32; i++) {
          if (currentVertex >= totalVertex) break;

          position.fromArray(positions, currentVertex * 3);
          position.applyMatrix4(object.matrixWorld);

          normal.fromArray(normals, currentVertex * 3);
          normal.applyMatrix3(normalMatrix.getNormalMatrix(object.matrixWorld)).normalize();

          camera.position.copy(position);
          camera.lookAt(position.add(normal));

          renderer.setRenderTarget(rt);
          renderer.render(clone, camera);

          renderer.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, buffer);

          color[0] = 0;
          color[1] = 0;
          color[2] = 0;

          for (let k = 0, kl = buffer.length; k < kl; k += 4) {
            color[0] += buffer[k + 0];
            color[1] += buffer[k + 1];
            color[2] += buffer[k + 2];
          }

          colors[currentVertex * 3 + 0] = color[0] / (SIZE2 * 255);
          colors[currentVertex * 3 + 1] = color[1] / (SIZE2 * 255);
          colors[currentVertex * 3 + 2] = color[2] / (SIZE2 * 255);

          currentVertex++;
        }

        attributes.color.addUpdateRange(startVertex * 3, (currentVertex - startVertex) * 3);
        attributes.color.needsUpdate = true;

        if (currentVertex >= totalVertex) {
          clone = scene.clone();
          clone.matrixWorldAutoUpdate = false;

          bounces++;
          currentVertex = 0;
        }

        requestAnimationFrame(compute);
      }

      requestAnimationFrame(compute);
    };

    //

    let camera, scene, renderer;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 4;

      scene = new THREE.Scene();

      // torus knot

      const torusGeometry = new THREE.TorusKnotGeometry(0.75, 0.3, 128, 32, 1);
      const material = new THREE.MeshBasicMaterial({ vertexColors: true });

      const torusKnot = new GIMesh(torusGeometry, material);
      scene.add(torusKnot);

      // room

      const materials = [];

      for (let i = 0; i < 8; i++) {
        materials.push(
          new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.BackSide })
        );
      }

      const boxGeometry = new THREE.BoxGeometry(3, 3, 3);

      const box = new THREE.Mesh(boxGeometry, materials);
      scene.add(box);

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      new SimpleGI(renderer, scene);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 1;
      controls.maxDistance = 10;

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
