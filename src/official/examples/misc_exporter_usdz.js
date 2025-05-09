import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_exporter_usdz',
  useLoaders: { GLTFLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- USDZ exporter' }
    ],
    [
      { tag: 'text', content: 'Battle Damaged Sci-fi Helmet by' },
      { tag: 'a', link: 'https://sketchfab.com/theblueturtle_', content: 'theblueturtle_' }
    ]
  ],
  init: ({
    window,
    canvas,
    GUI,
    Stats,
    needToDispose,
    useFrame,
    saveFile,
    requestLoading,
    cancelLoading
  }) => {
    let camera, scene, renderer;

    const params = {
      exportUSDZ() {}
    };

    init();
    render();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
      camera.position.set(-2.5, 0.6, 3.0);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

      const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');
      loader.load('DamagedHelmet.gltf', async function (gltf) {
        scene.add(gltf.scene);

        const shadowMesh = createSpotShadowMesh();
        shadowMesh.position.y = -1.1;
        shadowMesh.position.z = -0.25;
        shadowMesh.scale.setScalar(2);
        scene.add(shadowMesh);

        render();

        // USDZ

        params.exportUSDZ = async function () {
          try {
            await requestLoading('生成中');
            const exporter = new USDZExporter();
            const result = await exporter.parseAsync(gltf.scene);
            await saveFile('asset.usdz', result.buffer);
          } catch (e) {
          } finally {
            cancelLoading();
          }
        };
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.target.set(0, -0.15, -0.2);
      controls.update();

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      gui.add(params, 'exportUSDZ').name('Export USDZ');
      gui.open();

      needToDispose(renderer, scene, controls);
    }

    function createSpotShadowMesh() {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0.1, 'rgba(130,130,130,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,1)');

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const shadowTexture = new THREE.CanvasTexture(canvas);

      const geometry = new THREE.PlaneGeometry();
      const material = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        blending: THREE.MultiplyBlending,
        toneMapped: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;

      return mesh;
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
