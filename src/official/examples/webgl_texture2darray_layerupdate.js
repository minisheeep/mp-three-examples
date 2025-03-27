import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_texture2darray_layerupdate',
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
        content: '- 2D Compressed Texture Array Layer Updates'
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
    let camera, scene, mesh, renderer;

    const planeWidth = 20;
    const planeHeight = 10;

    init();

    async function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.z = 70;

      scene = new THREE.Scene();

      // Configure the renderer.

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Configure the KTX2 loader.

      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath(
        'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/basis/'
      );
      ktx2Loader.detectSupport(renderer);

      // Load several KTX2 textures which will later be used to modify
      // specific texture array layers.

      const spiritedaway = await ktx2Loader.loadAsync('textures/spiritedaway.ktx2');

      // Create a texture array for rendering.

      const layerByteLength = THREE.TextureUtils.getByteLength(
        spiritedaway.image.width,
        spiritedaway.image.height,
        spiritedaway.format,
        spiritedaway.type
      );

      const textureArray = new THREE.CompressedArrayTexture(
        [
          {
            data: new Uint8Array(layerByteLength * 3),
            width: spiritedaway.image.width,
            height: spiritedaway.image.height
          }
        ],
        spiritedaway.image.width,
        spiritedaway.image.height,
        3,
        spiritedaway.format,
        spiritedaway.type
      );

      // Setup the GUI

      const formData = {
        srcLayer: 0,
        destLayer: 0,
        transfer() {
          const layerElementLength =
            layerByteLength / spiritedaway.mipmaps[0].data.BYTES_PER_ELEMENT;
          textureArray.mipmaps[0].data.set(
            spiritedaway.mipmaps[0].data.subarray(
              layerElementLength * (formData.srcLayer % spiritedaway.image.depth),
              layerElementLength * ((formData.srcLayer % spiritedaway.image.depth) + 1)
            ),
            layerByteLength * formData.destLayer
          );
          textureArray.addLayerUpdate(formData.destLayer);
          textureArray.needsUpdate = true;

          renderer.render(scene, camera);
        }
      };

      const gui = new GUI();
      gui.add(formData, 'srcLayer', 0, spiritedaway.image.depth - 1, 1);
      gui.add(formData, 'destLayer', 0, textureArray.image.depth - 1, 1);
      gui.add(formData, 'transfer');

      /// Setup the scene.

      const material = new THREE.ShaderMaterial({
        uniforms: {
          diffuse: { value: textureArray },
          size: { value: new THREE.Vector2(planeWidth, planeHeight) }
        },
        vertexShader: `
	uniform vec2 size;
	attribute uint instancedIndex;
	flat out uint diffuseIndex;
	out vec2 vUv;

	void main() {

		vec3 translation = vec3(0, float(instancedIndex) * size.y - size.y, 0);
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position + translation, 1.0 );

		diffuseIndex = instancedIndex;

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
	flat in uint diffuseIndex;

	out vec4 outColor;

	void main() {

		outColor = texture( diffuse, vec3( vUv, diffuseIndex ) );

	}
	`,
        glslVersion: THREE.GLSL3
      });

      const geometry = new THREE.InstancedBufferGeometry();
      geometry.copy(new THREE.PlaneGeometry(planeWidth, planeHeight));
      geometry.instanceCount = 3;

      const instancedIndexAttribute = new THREE.InstancedBufferAttribute(
        new Uint16Array([0, 1, 2]),
        1,
        false,
        1
      );
      instancedIndexAttribute.gpuType = THREE.IntType;
      geometry.setAttribute('instancedIndex', instancedIndexAttribute);

      mesh = new THREE.InstancedMesh(geometry, material, 3);

      scene.add(mesh);

      window.addEventListener('resize', onWindowResize);

      // Initialize the texture array by first rendering the spirited away
      // frames in order.

      textureArray.mipmaps[0].data.set(
        spiritedaway.mipmaps[0].data.subarray(0, textureArray.mipmaps[0].data.length)
      );
      textureArray.needsUpdate = true;
      renderer.render(scene, camera);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
