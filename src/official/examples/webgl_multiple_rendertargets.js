import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_multiple_rendertargets',
  useLoaders: [],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'threejs'
      },
      {
        tag: 'text',
        content: 'webgl - Multiple RenderTargets'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls;
    let renderTarget;
    let postScene, postCamera;

    const parameters = {
      samples: 4,
      wireframe: false
    };

    const gui = new GUI();
    gui.add(parameters, 'samples', 0, 4).step(1);
    gui.add(parameters, 'wireframe');
    gui.onChange(render);

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Create a multi render target with Float buffers

      renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
        {
          count: 2,
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter
        }
      );

      // Name our G-Buffer attachments for debugging

      renderTarget.textures[0].name = 'diffuse';
      renderTarget.textures[1].name = 'normal';

      // Scene setup

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x222222);

      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
      camera.position.z = 4;

      const loader = new THREE.TextureLoader();

      const diffuse = loader.load('textures/hardwood2_diffuse.jpg', render);
      diffuse.wrapS = THREE.RepeatWrapping;
      diffuse.wrapT = THREE.RepeatWrapping;
      diffuse.colorSpace = THREE.SRGBColorSpace;

      scene.add(
        new THREE.Mesh(
          new THREE.TorusKnotGeometry(1, 0.3, 128, 32),
          new THREE.RawShaderMaterial({
            name: 'G-Buffer Shader',
            vertexShader: `
			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec3 vNormal;
			out vec2 vUv;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			void main() {

				vUv = uv;

				// get smooth normals
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				vec3 transformedNormal = normalMatrix * normal;
				vNormal = normalize( transformedNormal );

				gl_Position = projectionMatrix * mvPosition;

			}
		`,
            fragmentShader: `
			precision highp float;
			precision highp int;

			layout(location = 0) out vec4 gColor;
			layout(location = 1) out vec4 gNormal;

			uniform sampler2D tDiffuse;
			uniform vec2 repeat;

			in vec3 vNormal;
			in vec2 vUv;

			void main() {

				// write color to G-Buffer
				gColor = texture( tDiffuse, vUv * repeat );

				// write normals to G-Buffer
				gNormal = vec4( normalize( vNormal ), 0.0 );

			}
		`,
            uniforms: {
              tDiffuse: { value: diffuse },
              repeat: { value: new THREE.Vector2(5, 0.5) }
            },
            glslVersion: THREE.GLSL3
          })
        )
      );

      // PostProcessing setup

      postScene = new THREE.Scene();
      postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      postScene.add(
        new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.RawShaderMaterial({
            name: 'Post-FX Shader',
            vertexShader: `
			in vec3 position;
			in vec2 uv;

			out vec2 vUv;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			void main() {

				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
		`,
            fragmentShader: `
			precision highp float;
			precision highp int;

			vec4 LinearTosRGB( in vec4 value ) {
				return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
			}

			layout(location = 0) out vec4 pc_FragColor;

			in vec2 vUv;

			uniform sampler2D tDiffuse;
			uniform sampler2D tNormal;

			void main() {

				vec4 diffuse = texture( tDiffuse, vUv );
				vec4 normal = texture( tNormal, vUv );

				pc_FragColor = mix( diffuse, normal, step( 0.5, vUv.x ) );
				pc_FragColor.a = 1.0;

				pc_FragColor = LinearTosRGB( pc_FragColor );

			}
		`,
            uniforms: {
              tDiffuse: { value: renderTarget.textures[0] },
              tNormal: { value: renderTarget.textures[1] }
            },
            glslVersion: THREE.GLSL3
          })
        )
      );

      // Controls

      controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);

      canvas.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      const dpr = renderer.getPixelRatio();
      renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);

      render();
    }

    function render() {
      renderTarget.samples = parameters.samples;

      scene.traverse(function (child) {
        if (child.material !== undefined) {
          child.material.wireframe = parameters.wireframe;
        }
      });

      // render scene into target
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // render post FX
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
    }
  }
};
export { exampleInfo as default };
