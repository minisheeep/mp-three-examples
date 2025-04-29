import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_modified',
  useLoaders: { GLTFLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - modified material.'
      }
    ],
    [
      {
        tag: 'a',
        link: 'https://casual-effects.com/data/',
        content: 'Lee Perry-Smith'
      },
      {
        tag: 'text',
        content: 'head.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 20;

      scene = new THREE.Scene();

      const loader = new GLTFLoader();
      loader.load('models/gltf/LeePerrySmith/LeePerrySmith.glb', function (gltf) {
        const geometry = gltf.scene.children[0].geometry;

        let mesh = new THREE.Mesh(geometry, buildTwistMaterial(2.0));
        mesh.position.x = -3.5;
        mesh.position.y = -0.5;
        scene.add(mesh);

        mesh = new THREE.Mesh(geometry, buildTwistMaterial(-2.0));
        mesh.position.x = 3.5;
        mesh.position.y = -0.5;
        scene.add(mesh);
      });

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 50;

      //

      stats = new Stats(renderer);

      // EVENTS

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function buildTwistMaterial(amount) {
      const material = new THREE.MeshNormalMaterial();
      material.onBeforeCompile = function (shader) {
        shader.uniforms.time = { value: 0 };

        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          [
            `float theta = sin( time + position.y ) / ${amount.toFixed(1)};`,
            'float c = cos( theta );',
            'float s = sin( theta );',
            'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
            'vec3 transformed = vec3( position ) * m;',
            'vNormal = vNormal * m;'
          ].join('\n')
        );

        material.userData.shader = shader;
      };

      // Make sure WebGLRenderer doesnt reuse a single program

      material.customProgramCacheKey = function () {
        return amount.toFixed(1);
      };

      return material;
    }

    //

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      render();
    }

    //

    function animate() {
      render();

      stats.update();
    }

    const startTime = Date.now();

    function render() {
      scene.traverse(function (child) {
        if (child.isMesh) {
          const shader = child.material.userData.shader;

          if (shader) {
            shader.uniforms.time.value = (Date.now() - startTime) / 1000;
          }
        }
      });

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
