import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_modifier_simplifier',
  useLoaders: [GLTFLoader],
  info: [
    [
      {
        tag: 'a',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Vertex Reduction using SimplifyModifier'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 15;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.enablePan = false;
      controls.enableZoom = false;

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));

      const light = new THREE.PointLight(0xffffff, 400);
      camera.add(light);
      scene.add(camera);

      new GLTFLoader().load('models/gltf/LeePerrySmith/LeePerrySmith.glb', function (gltf) {
        const mesh = gltf.scene.children[0];
        mesh.position.x = -3;
        mesh.rotation.y = Math.PI / 2;
        scene.add(mesh);

        const modifier = new SimplifyModifier();

        const simplified = mesh.clone();
        simplified.material = simplified.material.clone();
        simplified.material.flatShading = true;
        const count = Math.floor(simplified.geometry.attributes.position.count * 0.875); // number of vertices to remove
        simplified.geometry = modifier.modify(simplified.geometry, count);

        simplified.position.x = 3;
        simplified.rotation.y = -Math.PI / 2;
        scene.add(simplified);

        render();
      });

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
