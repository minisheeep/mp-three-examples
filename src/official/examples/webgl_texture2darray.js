import * as THREE from 'three';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_texture2darray',
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
        content: '- 2D Texture array'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Scanned head data by'
      },
      {
        tag: 'a',
        link: 'https://www.codeproject.com/Articles/352270/Getting-started-with-Volume-Rendering',
        content: 'Divine Augustine'
      },
      {
        tag: 'text',
        content: 'licensed under'
      },
      {
        tag: 'a',
        link: 'https://www.codeproject.com/info/cpol10.aspx',
        content: 'CPOL'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, mesh, renderer, stats;

    const planeWidth = 50;
    const planeHeight = 50;

    let depthStep = 0.4;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.z = 70;

      scene = new THREE.Scene();

      // width 256, height 256, depth 109, 8-bit, zip archived raw data

      new THREE.FileLoader()
        .setResponseType('arraybuffer')
        .load('textures/3d/head256x256x109.zip', function (data) {
          const zip = unzipSync(new Uint8Array(data));
          const array = new Uint8Array(zip['head256x256x109'].buffer);

          const texture = new THREE.DataArrayTexture(array, 256, 256, 109);
          texture.format = THREE.RedFormat;
          texture.needsUpdate = true;

          const material = new THREE.ShaderMaterial({
            uniforms: {
              diffuse: { value: texture },
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
		outColor = vec4( color.rrr * 1.5, 1.0 );

	}
	`,
            glslVersion: THREE.GLSL3
          });

          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

          mesh = new THREE.Mesh(geometry, material);

          scene.add(mesh);
        });

      // 2D Texture array is available on WebGL 2.0

      renderer = new THREE.WebGLRenderer({ canvas });
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
      if (mesh) {
        let value = mesh.material.uniforms['depth'].value;

        value += depthStep;

        if (value > 109.0 || value < 0.0) {
          if (value > 1.0) value = 109.0 * 2.0 - value;
          if (value < 0.0) value = -value;

          depthStep = -depthStep;
        }

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
