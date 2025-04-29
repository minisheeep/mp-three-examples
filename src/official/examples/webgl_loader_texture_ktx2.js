import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_ktx2',
  useLoaders: { KTX2Loader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl - KTX2 texture loader' }
    ],
    [
      { tag: 'a', link: 'http://github.khronos.org/KTX-Specification/', content: 'KTX2' },
      { tag: 'text', content: 'with' },
      {
        tag: 'a',
        link: 'https://github.com/binomialLLC/basis_universal',
        content: 'Basis Universal GPU Texture Codec'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls, loader, material;

    const SAMPLES = {
      'BasisU ETC1S': '2d_etc1s.ktx2',
      'BasisU UASTC': '2d_uastc.ktx2',
      'RGBA8 sRGB': '2d_rgba8.ktx2',
      'RGBA8 Linear': '2d_rgba8_linear.ktx2',
      // 'RGBA8 Display P3': '2d_rgba8_displayp3.ktx2',
      'RGBA16 Linear': '2d_rgba16_linear.ktx2',
      'RGBA32 Linear': '2d_rgba32_linear.ktx2',
      'ASTC 6x6 (mobile)': '2d_astc_6x6.ktx2'
    };

    const FORMAT_LABELS = {
      [THREE.RGBAFormat]: 'RGBA',
      [THREE.RGBA_BPTC_Format]: 'RGBA_BPTC',
      [THREE.RGBA_ASTC_4x4_Format]: 'RGBA_ASTC_4x4',
      [THREE.RGB_S3TC_DXT1_Format]: 'RGB_S3TC_DXT1',
      [THREE.RGBA_S3TC_DXT5_Format]: 'RGBA_S3TC_DXT5',
      [THREE.RGB_PVRTC_4BPPV1_Format]: 'RGB_PVRTC_4BPPV1',
      [THREE.RGBA_PVRTC_4BPPV1_Format]: 'RGBA_PVRTC_4BPPV1',
      [THREE.RGB_ETC1_Format]: 'RGB_ETC1',
      [THREE.RGB_ETC2_Format]: 'RGB_ETC2',
      [THREE.RGBA_ETC2_EAC_Format]: 'RGB_ETC2_EAC'
    };

    const TYPE_LABELS = {
      [THREE.UnsignedByteType]: 'UnsignedByteType',
      [THREE.ByteType]: 'ByteType',
      [THREE.ShortType]: 'ShortType',
      [THREE.UnsignedShortType]: 'UnsignedShortType',
      [THREE.IntType]: 'IntType',
      [THREE.UnsignedIntType]: 'UnsignedIntType',
      [THREE.FloatType]: 'FloatType',
      [THREE.HalfFloatType]: 'HalfFloatType'
    };

    const params = {
      sample: Object.values(SAMPLES)[0]
    };

    init();

    async function init() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      window.addEventListener('resize', onWindowResize);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x202020);

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.set(0, 0, 2.5);
      camera.lookAt(scene.position);
      scene.add(camera);

      controls = new OrbitControls(camera, renderer.domElement);

      // PlaneGeometry UVs assume flipY=true, which compressed textures don't support.
      const geometry = flipY(new THREE.PlaneGeometry());
      material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      loader = new KTX2Loader()
        .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/basis/')
        .detectSupport(renderer);

      const gui = new GUI();

      gui.add(params, 'sample', SAMPLES).onChange(loadTexture);

      await loadTexture(params.sample);

      renderer.setAnimationLoop(animate);

      needToDispose(renderer, scene, controls, loader);
    }

    function animate() {
      controls.update();

      renderer.render(scene, camera);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    async function loadTexture(path) {
      try {
        const texture = await loader.loadAsync(`./textures/compressed/${path}`);
        texture.minFilter = THREE.NearestMipmapNearestFilter;

        material.map = texture;
        material.needsUpdate = true;

        console.info(`format: ${FORMAT_LABELS[texture.format]}`);
        console.info(`type: ${TYPE_LABELS[texture.type]}`);
        console.info(`colorSpace: ${texture.colorSpace}`);
      } catch (e) {
        console.error(e);
      }

      // NOTE: Call `loader.dispose()` when finished loading textures.
    }

    /** Correct UVs to be compatible with `flipY=false` textures. */
    function flipY(geometry) {
      const uv = geometry.attributes.uv;

      for (let i = 0; i < uv.count; i++) {
        uv.setY(i, 1 - uv.getY(i));
      }

      return geometry;
    }
  }
};
export { exampleInfo as default };
