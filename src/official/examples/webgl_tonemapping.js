import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_tonemapping',
  useLoaders: { GLTFLoader, RGBELoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Tone Mapping'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Battle Damaged Sci-fi Helmet by'
      },
      {
        tag: 'a',
        link: 'https://sketchfab.com/theblueturtle_',
        content: 'theblueturtle_'
      },
      {
        tag: 'a',
        link: 'https://hdrihaven.com/hdri/?h=venice_sunset',
        content: 'Venice Sunset'
      },
      {
        tag: 'text',
        content: 'from'
      },
      {
        tag: 'a',
        link: 'https://hdrihaven.com/',
        content: 'HDRI Haven'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let mesh, renderer, scene, camera, controls;
    let gui,
      guiExposure = null;

    const params = {
      exposure: 1.0,
      toneMapping: 'AgX',
      blurriness: 0.3,
      intensity: 1.0
    };

    const toneMappingOptions = {
      None: THREE.NoToneMapping,
      Linear: THREE.LinearToneMapping,
      Reinhard: THREE.ReinhardToneMapping,
      Cineon: THREE.CineonToneMapping,
      ACESFilmic: THREE.ACESFilmicToneMapping,
      AgX: THREE.AgXToneMapping,
      Neutral: THREE.NeutralToneMapping,
      Custom: THREE.CustomToneMapping
    };

    init().catch(function (err) {
      console.error(err);
    });

    async function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = toneMappingOptions[params.toneMapping];
      renderer.toneMappingExposure = params.exposure;

      // Set CustomToneMapping to Uncharted2
      // source: http://filmicworlds.com/blog/filmic-tonemapping-operators/

      THREE.ShaderChunk.tonemapping_pars_fragment =
        THREE.ShaderChunk.tonemapping_pars_fragment.replace(
          'vec3 CustomToneMapping( vec3 color ) { return color; }',

          `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )

					float toneMappingWhitePoint = 1.0;

					vec3 CustomToneMapping( vec3 color ) {
						color *= toneMappingExposure;
						return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );

					}`
        );

      scene = new THREE.Scene();
      scene.backgroundBlurriness = params.blurriness;

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
      camera.position.set(-1.8, 0.6, 2.7);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.target.set(0, 0, -0.2);
      controls.update();

      const rgbeLoader = new RGBELoader().setPath('textures/equirectangular/');

      const gltfLoader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');

      const [texture, gltf] = await Promise.all([
        rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
        gltfLoader.loadAsync('DamagedHelmet.gltf')
      ]);

      // environment

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // model

      mesh = gltf.scene.getObjectByName('node_damagedHelmet_-6514');
      scene.add(mesh);

      render();

      window.addEventListener('resize', onWindowResize);

      gui = new GUI();
      const toneMappingFolder = gui.addFolder('tone mapping');

      toneMappingFolder
        .add(params, 'toneMapping', Object.keys(toneMappingOptions))

        .onChange(function () {
          updateGUI(toneMappingFolder);

          renderer.toneMapping = toneMappingOptions[params.toneMapping];
          render();
        });

      const backgroundFolder = gui.addFolder('background');

      backgroundFolder
        .add(params, 'blurriness', 0, 1)

        .onChange(function (value) {
          scene.backgroundBlurriness = value;
          render();
        });

      backgroundFolder
        .add(params, 'intensity', 0, 1)

        .onChange(function (value) {
          scene.backgroundIntensity = value;
          render();
        });

      updateGUI(toneMappingFolder);

      gui.open();
      needToDispose(renderer, scene, controls);
    }

    function updateGUI(folder) {
      if (guiExposure !== null) {
        guiExposure.destroy();
        guiExposure = null;
      }

      if (params.toneMapping !== 'None') {
        guiExposure = folder
          .add(params, 'exposure', 0, 2)

          .onChange(function () {
            renderer.toneMappingExposure = params.exposure;
            render();
          });
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
