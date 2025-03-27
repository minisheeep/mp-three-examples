import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_texture2darray_compressed',
  useLoaders: [KTX2Loader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- 2D Compressed Texture Array'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Loop from the movie Spirited away by the'
      },
      {
        tag: 'a',
        link: 'https://www.ghibli.jp/',
        content: 'Studio Ghibli'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, mesh, renderer, stats, clock;

    const planeWidth = 50;
    const planeHeight = 25;

    let depthStep = 1;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.z = 70;

      scene = new THREE.Scene();

      //
      clock = new THREE.Clock();

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath(
        'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/basis/'
      );
      ktx2Loader.detectSupport(renderer);

      ktx2Loader.load('textures/spiritedaway.ktx2', function (texturearray) {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            diffuse: { value: texturearray },
            depth: { value: 55 },
            size: { value: new THREE.Vector2(planeWidth, planeHeight) }
          },
          vertexShader: `
	uniform vec2 size;
	out vec2 vUv;

	void main() {

		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		// Convert position.xy to 1.0-0.0

		vUv.xy = position.xy / size + 0.5;
		vUv.y = 1.0 - vUv.y; // original data is upside down

	}
	`,
          fragmentShader: `
	precision highp float;
	precision highp int;
	precision highp sampler2DArray;

	uniform sampler2DArray diffuse;
	in vec2 vUv;
	uniform int depth;

	out vec4 outColor;

	void main() {

		vec4 color = texture( diffuse, vec3( vUv, depth ) );

		// lighten a bit
		outColor = vec4( color.rgb + .2, 1.0 );

	}
	`,
          glslVersion: THREE.GLSL3
        });

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

        mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);
      });

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
      if (mesh) {
        const delta = clock.getDelta() * 10;

        depthStep += delta;

        const value = depthStep % 5;

        mesh.material.uniforms['depth'].value = value;
      }

      render();
      stats.update();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
