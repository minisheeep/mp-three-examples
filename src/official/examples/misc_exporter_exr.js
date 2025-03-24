import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EXRExporter,
  NO_COMPRESSION,
  ZIP_COMPRESSION,
  ZIPS_COMPRESSION
} from 'three/examples/jsm/exporters/EXRExporter.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_exporter_exr',
  useLoaders: [RGBELoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - exporter - exr'
      }
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
    let scene, camera, renderer, exporter, mesh, controls, renderTarget, dataTexture;

    const params = {
      target: 'pmrem',
      type: 'HalfFloatType',
      compression: 'ZIP',
      export: exportFile
    };

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(10, 0, 0);

      scene = new THREE.Scene();

      exporter = new EXRExporter();
      const rgbeloader = new RGBELoader();

      //

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      rgbeloader.load('textures/equirectangular/san_giuseppe_bridge_2k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        renderTarget = pmremGenerator.fromEquirectangular(texture);
        scene.background = renderTarget.texture;
      });

      createDataTexture();

      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.rotateSpeed = -0.25; // negative, to track mouse pointer

      //

      window.addEventListener('resize', onWindowResize);

      const gui = new GUI();

      const input = gui.addFolder('Input');
      input.add(params, 'target').options(['pmrem', 'data-texture']).onChange(swapScene);

      const options = gui.addFolder('Output Options');
      options.add(params, 'type').options(['FloatType', 'HalfFloatType']);
      options.add(params, 'compression').options(['ZIP', 'ZIPS', 'NONE']);

      gui.add(params, 'export').name('Export EXR');
      gui.open();
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      controls.update();
      renderer.render(scene, camera);
    }

    function createDataTexture() {
      const normal = new THREE.Vector3();
      const coord = new THREE.Vector2();
      const size = 800,
        radius = 320,
        factor = (Math.PI * 0.5) / radius;
      const data = new Float32Array(4 * size * size);

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const idx = i * size * 4 + j * 4;
          coord.set(j, i).subScalar(size / 2);

          if (coord.length() < radius)
            normal.set(
              Math.sin(coord.x * factor),
              Math.sin(coord.y * factor),
              Math.cos(coord.x * factor)
            );
          else normal.set(0, 0, 1);

          data[idx + 0] = 0.5 + 0.5 * normal.x;
          data[idx + 1] = 0.5 + 0.5 * normal.y;
          data[idx + 2] = 0.5 + 0.5 * normal.z;
          data[idx + 3] = 1;
        }
      }

      dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
      dataTexture.needsUpdate = true;

      const material = new THREE.MeshBasicMaterial({ map: dataTexture });
      const quad = new THREE.PlaneGeometry(50, 50);
      mesh = new THREE.Mesh(quad, material);
      mesh.visible = false;

      scene.add(mesh);
    }

    function swapScene() {
      if (params.target == 'pmrem') {
        camera.position.set(10, 0, 0);
        controls.enabled = true;
        scene.background = renderTarget.texture;
        mesh.visible = false;
      } else {
        camera.position.set(0, 0, 70);
        controls.enabled = false;
        scene.background = new THREE.Color(0, 0, 0);
        mesh.visible = true;
      }
    }

    async function exportFile() {
      let result, exportType, exportCompression;
      await requestLoading('生成中');

      try {
        if (params.type == 'HalfFloatType') exportType = THREE.HalfFloatType;
        else exportType = THREE.FloatType;

        if (params.compression == 'ZIP') exportCompression = ZIP_COMPRESSION;
        else if (params.compression == 'ZIPS') exportCompression = ZIPS_COMPRESSION;
        else exportCompression = NO_COMPRESSION;

        if (params.target == 'pmrem')
          result = await exporter.parse(renderer, renderTarget, {
            type: exportType,
            compression: exportCompression
          });
        else
          result = await exporter.parse(dataTexture, {
            type: exportType,
            compression: exportCompression
          });

        await saveFile(params.target + '.exr', result);
      } catch (e) {
        console.error('生成出错');
      } finally {
        cancelLoading();
      }
    }
  }
};
export { exampleInfo as default };
