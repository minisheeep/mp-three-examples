import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_depth_texture',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'threejs'
      },
      {
        tag: 'text',
        content: 'webgl - depth texture'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Stores render target depth in a texture            attachment.'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Created by'
      },
      {
        tag: 'a',
        link: 'http://twitter.com/mattdesl',
        content: '@mattdesl'
      },
      {
        tag: 'text',
        content: '.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls, stats;
    let target;
    let postScene, postCamera, postMaterial;

    const params = {
      format: THREE.DepthFormat,
      type: THREE.UnsignedShortType,
      samples: 0
    };

    const formats = {
      DepthFormat: THREE.DepthFormat,
      DepthStencilFormat: THREE.DepthStencilFormat
    };
    const types = {
      UnsignedShortType: THREE.UnsignedShortType,
      UnsignedIntType: THREE.UnsignedIntType,
      FloatType: THREE.FloatType
    };

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      stats = new Stats(renderer);

      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 50);
      camera.position.z = 4;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      // Create a render target with depth texture
      setupRenderTarget();

      // Our scene
      setupScene();

      // Setup post-processing step
      setupPost();

      onWindowResize();
      window.addEventListener('resize', onWindowResize);

      //
      const gui = new GUI({ width: 300 });

      gui.add(params, 'format', formats).onChange(setupRenderTarget);
      gui.add(params, 'type', types).onChange(setupRenderTarget);
      gui.add(params, 'samples', 0, 16, 1).onChange(setupRenderTarget);
      gui.open();
      needToDispose(renderer, scene);
    }

    function setupRenderTarget() {
      if (target) target.dispose();

      const format = parseInt(params.format);
      const type = parseInt(params.type);
      const samples = parseInt(params.samples);

      const dpr = renderer.getPixelRatio();
      target = new THREE.WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);
      target.texture.minFilter = THREE.NearestFilter;
      target.texture.magFilter = THREE.NearestFilter;
      target.stencilBuffer = format === THREE.DepthStencilFormat ? true : false;
      target.samples = samples;

      target.depthTexture = new THREE.DepthTexture();
      target.depthTexture.format = format;
      target.depthTexture.type = type;
    }

    function setupPost() {
      // Setup post processing stage
      postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      postMaterial = new THREE.ShaderMaterial({
        vertexShader: `
			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
        fragmentShader: `
			#include <packing>

			varying vec2 vUv;
			uniform sampler2D tDiffuse;
			uniform sampler2D tDepth;
			uniform float cameraNear;
			uniform float cameraFar;


			float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			}

			void main() {
				//vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
				float depth = readDepth( tDepth, vUv );

				gl_FragColor.rgb = 1.0 - vec3( depth );
				gl_FragColor.a = 1.0;
			}
		`,
        uniforms: {
          cameraNear: { value: camera.near },
          cameraFar: { value: camera.far },
          tDiffuse: { value: null },
          tDepth: { value: null }
        }
      });
      const postPlane = new THREE.PlaneGeometry(2, 2);
      const postQuad = new THREE.Mesh(postPlane, postMaterial);
      postScene = new THREE.Scene();
      postScene.add(postQuad);

      needToDispose(postScene);
    }

    function setupScene() {
      scene = new THREE.Scene();

      const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 64);
      const material = new THREE.MeshBasicMaterial({ color: 'blue' });

      const count = 50;
      const scale = 5;

      for (let i = 0; i < count; i++) {
        const r = Math.random() * 2.0 * Math.PI;
        const z = Math.random() * 2.0 - 1.0;
        const zScale = Math.sqrt(1.0 - z * z) * scale;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.cos(r) * zScale, Math.sin(r) * zScale, z * scale);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        scene.add(mesh);
      }
    }

    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      const dpr = renderer.getPixelRatio();
      target.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      // render scene into target
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);

      // render post FX
      postMaterial.uniforms.tDiffuse.value = target.texture;
      postMaterial.uniforms.tDepth.value = target.depthTexture;

      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);

      controls.update(); // required because damping is enabled

      stats.update();
    }
  }
};
export { exampleInfo as default };
