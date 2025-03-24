import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import {
  BlurredEnvMapGenerator,
  GradientEquirectTexture,
  WebGLPathTracer
} from 'three-gpu-pathtracer';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_renderer_pathtracer',
  useLoaders: [RGBELoader, LDrawLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'pathtracer -'
      },
      {
        tag: 'a',
        link: 'https://github.com/gkjohnson/three-gpu-pathtracer',
        content: 'three-gpu-pathtracer'
      }
    ],
    [
      {
        tag: 'text',
        content: 'See'
      },
      {
        tag: 'a',
        link: 'https://github.com/gkjohnson/three-gpu-pathtracer',
        content: 'main project repository'
      },
      {
        tag: 'text',
        content: 'for more information and examples on high fidelity path tracing.'
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
    requestLoading,
    cancelLoading
  }) => {
    let camera, scene, renderer, controls, gui;
    let pathTracer, floor, gradientMap;

    const samplesEl = { value: 0 };
    const params = {
      enable: false,
      toneMapping: true,
      pause: false,
      tiles: 3,
      transparentBackground: false,
      resolutionScale: 1,
      roughness: 0.15,
      metalness: 0.9
    };

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.set(150, 200, 250);

      // initialize the renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
        canvas
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      gradientMap = new GradientEquirectTexture();
      gradientMap.topColor.set(0xeeeeee);
      gradientMap.bottomColor.set(0xeaeaea);
      gradientMap.update();

      // initialize the pathtracer
      pathTracer = new WebGLPathTracer(renderer);
      pathTracer.filterGlossyFactor = 1;
      pathTracer.minSamples = 3;
      pathTracer.renderScale = params.resolutionScale;
      pathTracer.tiles.set(params.tiles, params.tiles);

      // scene
      scene = new THREE.Scene();
      scene.background = gradientMap;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', () => {
        pathTracer.updateCamera();
      });

      window.addEventListener('resize', onWindowResize);
      onWindowResize();

      // load materials and then the model
      createGUI();

      loadModel();

      needToDispose(renderer, scene, controls);
    }

    async function loadModel() {
      let model = null;
      let environment = null;

      updateProgressBar(0);
      showProgressBar();

      // only smooth when not rendering with flat colors to improve processing time
      const lDrawLoader = new LDrawLoader();
      lDrawLoader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
      const ldrawPromise = lDrawLoader
        .setPath('models/ldraw/officialLibrary/')
        .loadAsync('models/7140-1-X-wingFighter.mpd_Packed.mpd', onProgress)
        .then(function (legoGroup) {
          // Convert from LDraw coordinates: rotate 180 degrees around OX
          legoGroup = LDrawUtils.mergeObject(legoGroup);
          legoGroup.rotation.x = Math.PI;
          legoGroup.updateMatrixWorld();
          model = legoGroup;

          legoGroup.traverse((c) => {
            // hide the line segments
            if (c.isLineSegments) {
              c.visible = false;
            }

            // adjust the materials to use transmission, be a bit shinier
            if (c.material) {
              c.material.roughness *= 0.25;

              if (c.material.opacity < 1.0) {
                const oldMaterial = c.material;
                const newMaterial = new THREE.MeshPhysicalMaterial();

                newMaterial.opacity = 1.0;
                newMaterial.transmission = 1.0;
                newMaterial.thickness = 1.0;
                newMaterial.ior = 1.4;
                newMaterial.roughness = oldMaterial.roughness;
                newMaterial.metalness = 0.0;

                const hsl = {};
                oldMaterial.color.getHSL(hsl);
                hsl.l = Math.max(hsl.l, 0.35);
                newMaterial.color.setHSL(hsl.h, hsl.s, hsl.l);

                c.material = newMaterial;
              }
            }
          });
        })
        .catch(onError);

      const envMapPromise = new RGBELoader()
        .setPath('textures/equirectangular/')
        .loadAsync('royal_esplanade_1k.hdr')
        .then((tex) => {
          const envMapGenerator = new BlurredEnvMapGenerator(renderer);
          const blurredEnvMap = envMapGenerator.generate(tex, 0);

          environment = blurredEnvMap;
        })
        .catch(onError);

      await Promise.all([envMapPromise, ldrawPromise]);

      hideProgressBar();

      // set environment map
      scene.environment = environment;

      // Adjust camera
      const bbox = new THREE.Box3().setFromObject(model);
      const size = bbox.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, Math.max(size.y, size.z)) * 0.4;

      controls.target0.copy(bbox.getCenter(new THREE.Vector3()));
      controls.position0.set(2.3, 1, 2).multiplyScalar(radius).add(controls.target0);
      controls.reset();

      // add the model
      scene.add(model);

      // add floor
      floor = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.MeshStandardMaterial({
          side: THREE.DoubleSide,
          roughness: params.roughness,
          metalness: params.metalness,
          map: generateRadialFloorTexture(1024),
          transparent: true
        })
      );
      floor.scale.setScalar(2500);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = bbox.min.y;
      scene.add(floor);

      // reset the progress bar to display bvh generation
      updateProgressBar(0);

      pathTracer.setScene(scene, camera);

      renderer.setAnimationLoop(animate);
    }

    function onWindowResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio;

      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);

      const aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      pathTracer.updateCamera();
    }

    function createGUI() {
      if (gui) {
        gui.destroy();
      }

      gui = new GUI();
      gui.add(params, 'enable');
      gui.add(params, 'pause');
      gui.add(params, 'toneMapping');
      gui.add(params, 'transparentBackground').onChange((v) => {
        scene.background = v ? null : gradientMap;
        pathTracer.updateEnvironment();
      });
      gui.add(params, 'resolutionScale', 0.1, 1.0, 0.1).onChange((v) => {
        pathTracer.renderScale = v;
        pathTracer.reset();
      });
      gui.add(params, 'tiles', 1, 6, 1).onChange((v) => {
        pathTracer.tiles.set(v, v);
      });
      gui
        .add(params, 'roughness', 0, 1)
        .name('floor roughness')
        .onChange((v) => {
          floor.material.roughness = v;
          pathTracer.updateMaterials();
        });
      gui
        .add(params, 'metalness', 0, 1)
        .name('floor metalness')
        .onChange((v) => {
          floor.material.metalness = v;
          pathTracer.updateMaterials();
        });
      // gui.add(params, 'download').name('download image');
    }

    //

    function animate() {
      renderer.toneMapping = params.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;

      const samples = Math.floor(pathTracer.samples);
      samplesEl.value = `samples: ${samples}`;

      pathTracer.enablePathTracing = params.enable;
      pathTracer.pausePathTracing = params.pause;
      pathTracer.renderSample();

      samplesEl.value = `samples: ${Math.floor(pathTracer.samples)}`;
    }

    function onProgress(xhr) {
      if (xhr.lengthComputable) {
        updateProgressBar(xhr.loaded / xhr.total);
      }
    }

    function onError(error) {
      const message = 'Error loading model';
      console.log(message);
      console.error(error);
    }

    function showProgressBar() {
      return requestLoading('加载中');
    }

    function hideProgressBar() {
      cancelLoading();
    }

    function updateProgressBar(fraction) {}

    function generateRadialFloorTexture(dim) {
      const data = new Uint8Array(dim * dim * 4);

      for (let x = 0; x < dim; x++) {
        for (let y = 0; y < dim; y++) {
          const xNorm = x / (dim - 1);
          const yNorm = y / (dim - 1);

          const xCent = 2.0 * (xNorm - 0.5);
          const yCent = 2.0 * (yNorm - 0.5);
          let a = Math.max(Math.min(1.0 - Math.sqrt(xCent ** 2 + yCent ** 2), 1.0), 0.0);
          a = a ** 1.5;
          a = a * 1.5;
          a = Math.min(a, 1.0);

          const i = y * dim + x;
          data[i * 4 + 0] = 255;
          data[i * 4 + 1] = 255;
          data[i * 4 + 2] = 255;
          data[i * 4 + 3] = a * 255;
        }
      }

      const tex = new THREE.DataTexture(data, dim, dim);
      tex.format = THREE.RGBAFormat;
      tex.type = THREE.UnsignedByteType;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.needsUpdate = true;
      return tex;
    }
  }
};
export { exampleInfo as default };
