import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_cubemap_render_to_mipmaps',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- rendering to cubemap mip levels demo.' }
    ],
    [
      { tag: 'text', content: 'Left: original cubemap' },
      { tag: 'text', content: 'Right: generated cubemap' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    const CubemapFilterShader = {
      name: 'CubemapFilterShader',

      uniforms: {
        cubeTexture: { value: null },
        mipIndex: { value: 0 }
      },

      vertexShader: /* glsl */ `

					varying vec3 vWorldDirection;

					#include <common>

					void main() {
						vWorldDirection = transformDirection(position, modelMatrix);
						#include <begin_vertex>
						#include <project_vertex>
						gl_Position.z = gl_Position.w; // set z to camera.far
					}

					`,

      fragmentShader: /* glsl */ `

					uniform samplerCube cubeTexture;
					varying vec3 vWorldDirection;

					uniform float mipIndex;

					#include <common>

					void main() {
						vec3 cubeCoordinates = normalize(vWorldDirection);

						// Colorize mip levels
						vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
						if (mipIndex == 0.0) color.rgb = vec3(1.0, 1.0, 1.0);
						else if (mipIndex == 1.0) color.rgb = vec3(0.0, 0.0, 1.0);
						else if (mipIndex == 2.0) color.rgb = vec3(0.0, 1.0, 1.0);
						else if (mipIndex == 3.0) color.rgb = vec3(0.0, 1.0, 0.0);
						else if (mipIndex == 4.0) color.rgb = vec3(1.0, 1.0, 0.0);

						gl_FragColor = textureCube(cubeTexture, cubeCoordinates, 0.0) * color;
					}

					`
    };

    init();

    async function loadCubeTexture(urls) {
      return new Promise(function (resolve) {
        new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
          resolve(cubeTexture);
        });
      });
    }

    function allocateCubemapRenderTarget(cubeMapSize) {
      const params = {
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearMipMapLinearFilter,
        generateMipmaps: false,
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        colorSpace: THREE.LinearSRGBColorSpace,
        depthBuffer: false
      };

      const rt = new THREE.WebGLCubeRenderTarget(cubeMapSize, params);

      const mipLevels = Math.log(cubeMapSize) * Math.LOG2E + 1.0;
      for (let i = 0; i < mipLevels; i++) rt.texture.mipmaps.push({});

      rt.texture.mapping = THREE.CubeReflectionMapping;
      return rt;
    }

    function renderToCubeTexture(cubeMapRenderTarget, sourceCubeTexture) {
      const geometry = new THREE.BoxGeometry(5, 5, 5);

      const material = new THREE.ShaderMaterial({
        name: CubemapFilterShader.name,
        uniforms: THREE.UniformsUtils.clone(CubemapFilterShader.uniforms),
        vertexShader: CubemapFilterShader.vertexShader,
        fragmentShader: CubemapFilterShader.fragmentShader,
        side: THREE.BackSide,
        blending: THREE.NoBlending
      });

      material.uniforms.cubeTexture.value = sourceCubeTexture;

      const mesh = new THREE.Mesh(geometry, material);
      const cubeCamera = new THREE.CubeCamera(1, 10, cubeMapRenderTarget);
      const mipmapCount = Math.floor(
        Math.log2(Math.max(cubeMapRenderTarget.width, cubeMapRenderTarget.height))
      );

      for (let mipmap = 0; mipmap < mipmapCount; mipmap++) {
        material.uniforms.mipIndex.value = mipmap;
        material.needsUpdate = true;

        cubeMapRenderTarget.viewport.set(
          0,
          0,
          cubeMapRenderTarget.width >> mipmap,
          cubeMapRenderTarget.height >> mipmap
        );

        cubeCamera.activeMipmapLevel = mipmap;
        cubeCamera.update(renderer, mesh);
      }

      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    function init() {
      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 500;

      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 1.5;

      window.addEventListener('resize', onWindowResize);

      // Load a cube texture
      const r = 'textures/cube/Park3Med/';
      const urls = [
        r + 'px.jpg',
        r + 'nx.jpg',
        r + 'py.jpg',
        r + 'ny.jpg',
        r + 'pz.jpg',
        r + 'nz.jpg'
      ];

      loadCubeTexture(urls).then((cubeTexture) => {
        // Allocate a cube map render target
        const cubeMapRenderTarget = allocateCubemapRenderTarget(512);

        // Render to all the mip levels of cubeMapRenderTarget
        renderToCubeTexture(cubeMapRenderTarget, cubeTexture);

        // Create geometry
        const sphere = new THREE.SphereGeometry(100, 128, 128);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: cubeTexture });

        let mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(-100, 0, 0);
        scene.add(mesh);

        material = material.clone();
        material.envMap = cubeMapRenderTarget.texture;

        mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(100, 0, 0);
        scene.add(mesh);
      });

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
