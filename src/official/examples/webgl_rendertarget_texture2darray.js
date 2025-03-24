import * as THREE from 'three';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_rendertarget_texture2darray',
  useLoaders: [],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: ' three.js '
      },
      {
        tag: 'text',
        content: '- 2D Texture array framebuffer color attachment'
      }
    ],
    [
      {
        tag: 'text',
        content: 'This example shows how to render to an array of 2D texture.'
      }
    ],
    [
      {
        tag: 'text',
        content: 'WebGL2 allows to render to specific "layers" in 3D texture and array of textures.'
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
    const DIMENSIONS = {
      width: 256,
      height: 256,
      depth: 109
    };

    const params = {
      intensity: 1
    };

    /** Post-processing objects */

    const postProcessScene = new THREE.Scene();
    const postProcessCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderTarget = new THREE.WebGLArrayRenderTarget(
      DIMENSIONS.width,
      DIMENSIONS.height,
      DIMENSIONS.depth
    );
    renderTarget.texture.format = THREE.RedFormat;

    const postProcessMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uDepth: { value: 55 },
        uIntensity: { value: 1.0 }
      },
      vertexShader: `

	out vec2 vUv;

	void main()
	{
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}

	`,
      fragmentShader: `

	precision highp sampler2DArray;
	precision mediump float;

	in vec2 vUv;

	uniform sampler2DArray uTexture;
	uniform int uDepth;
	uniform float uIntensity;

	void main()
	{
		float voxel = texture(uTexture, vec3( vUv, uDepth )).r;
		gl_FragColor.r = voxel * uIntensity;
	}

	`
    });

    let depthStep = 0.4;

    let camera, scene, mesh, renderer, stats;

    const planeWidth = 50;
    const planeHeight = 50;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.z = 70;

      scene = new THREE.Scene();

      /** Post-processing scene */

      const planeGeometry = new THREE.PlaneGeometry(2, 2);
      const screenQuad = new THREE.Mesh(planeGeometry, postProcessMaterial);
      postProcessScene.add(screenQuad);

      // 2D Texture array is available on WebGL 2.0

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      gui
        .add(params, 'intensity', 0, 1)
        .step(0.01)
        .onChange((value) => (postProcessMaterial.uniforms.uIntensity.value = value));
      gui.open();

      // width 256, height 256, depth 109, 8-bit, zip archived raw data

      new THREE.FileLoader()
        .setResponseType('arraybuffer')
        .load('textures/3d/head256x256x109.zip', function (data) {
          const zip = unzipSync(new Uint8Array(data));
          const array = new Uint8Array(zip['head256x256x109'].buffer);

          const texture = new THREE.DataArrayTexture(
            array,
            DIMENSIONS.width,
            DIMENSIONS.height,
            DIMENSIONS.depth
          );
          texture.format = THREE.RedFormat;
          texture.needsUpdate = true;

          const material = new THREE.ShaderMaterial({
            uniforms: {
              diffuse: { value: renderTarget.texture },
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

	void main() {

		vec4 color = texture( diffuse, vec3( vUv, depth ) );

		// lighten a bit
		gl_FragColor = vec4( color.rrr * 1.5, 1.0 );
	}
	`
          });

          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

          mesh = new THREE.Mesh(geometry, material);

          scene.add(mesh);

          postProcessMaterial.uniforms.uTexture.value = texture;

          renderer.setAnimationLoop(animate);
        });
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      let value = mesh.material.uniforms['depth'].value;

      value += depthStep;

      if (value > 109.0 || value < 0.0) {
        if (value > 1.0) value = 109.0 * 2.0 - value;
        if (value < 0.0) value = -value;

        depthStep = -depthStep;
      }

      mesh.material.uniforms['depth'].value = value;

      render();

      stats.update();
    }

    /**
     * Renders the 2D array into the render target `renderTarget`.
     */
    function renderTo2DArray() {
      const layer = Math.floor(mesh.material.uniforms['depth'].value);
      postProcessMaterial.uniforms.uDepth.value = layer;
      renderer.setRenderTarget(renderTarget, layer);
      renderer.render(postProcessScene, postProcessCamera);
      renderer.setRenderTarget(null);
    }

    function render() {
      // Step 1 - Render the input DataArrayTexture into render target
      renderTo2DArray();

      // Step 2 - Renders the scene containing the plane with a material
      // sampling the render target texture.
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
