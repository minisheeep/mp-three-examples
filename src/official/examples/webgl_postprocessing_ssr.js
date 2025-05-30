import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_ssr',
  useLoaders: { DRACOLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- SSRPass demo by'
      },
      {
        tag: 'a',
        link: 'https://github.com/gonnavis',
        content: 'Vis'
      },
      {
        tag: 'text',
        content: '.'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, DecoderPath }) => {
    const params = {
      enableSSR: true,
      autoRotate: true,
      otherMeshes: true,
      groundReflector: true
    };
    let composer;
    let ssrPass;
    let gui;
    let stats;
    let controls;
    let camera, scene, renderer;
    const otherMeshes = [];
    let groundReflector;
    const selects = [];

    // Configure and create Draco decoder.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DecoderPath.STANDARD);
    // dracoLoader.setDecoderConfig( { type: 'js' } );

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 15);
      camera.position.set(0.13271600513224902, 0.3489546826045913, 0.43921296427927076);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x443333);
      scene.fog = new THREE.Fog(0x443333, 1, 4);

      // Ground
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.0001;
      // plane.receiveShadow = true;
      scene.add(plane);

      // Lights
      const hemiLight = new THREE.HemisphereLight(0x8d7c7c, 0x494966, 3);
      scene.add(hemiLight);

      const spotLight = new THREE.SpotLight();
      spotLight.intensity = 8;
      spotLight.angle = Math.PI / 16;
      spotLight.penumbra = 0.5;
      // spotLight.castShadow = true;
      spotLight.position.set(-1, 1, 1);
      scene.add(spotLight);

      dracoLoader.load('models/draco/bunny.drc', function (geometry) {
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0xa5a5a5 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = -0.0365;
        scene.add(mesh);
        selects.push(mesh);

        // Release decoder resources.
        dracoLoader.dispose();
      });

      let geometry, material, mesh;

      geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      material = new THREE.MeshStandardMaterial({ color: 'green' });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-0.12, 0.025, 0.015);
      scene.add(mesh);
      otherMeshes.push(mesh);
      selects.push(mesh);

      geometry = new THREE.IcosahedronGeometry(0.025, 4);
      material = new THREE.MeshStandardMaterial({ color: 'cyan' });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-0.05, 0.025, 0.08);
      scene.add(mesh);
      otherMeshes.push(mesh);
      selects.push(mesh);

      geometry = new THREE.ConeGeometry(0.025, 0.05, 64);
      material = new THREE.MeshStandardMaterial({ color: 'yellow' });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-0.05, 0.025, -0.055);
      scene.add(mesh);
      otherMeshes.push(mesh);
      selects.push(mesh);

      geometry = new THREE.PlaneGeometry(1, 1);
      groundReflector = new ReflectorForSSRPass(geometry, {
        clipBias: 0.0003,
        textureWidth: window.innerWidth,
        textureHeight: window.innerHeight,
        color: 0x888888,
        useDepthTexture: true
      });
      groundReflector.material.depthWrite = false;
      groundReflector.rotation.x = -Math.PI / 2;
      groundReflector.visible = false;
      scene.add(groundReflector);

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: false, canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 0.0635, 0);
      controls.update();
      controls.enabled = !params.autoRotate;

      // STATS

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      // composer

      composer = new EffectComposer(renderer);
      ssrPass = new SSRPass({
        renderer,
        scene,
        camera,
        width: window.innerWidth,
        height: window.innerHeight,
        groundReflector: params.groundReflector ? groundReflector : null,
        selects: params.groundReflector ? selects : null
      });

      composer.addPass(ssrPass);
      composer.addPass(new OutputPass());

      // GUI

      gui = new GUI({ width: 260 });
      gui.add(params, 'enableSSR').name('Enable SSR');
      gui.add(params, 'groundReflector').onChange(() => {
        if (params.groundReflector) {
          (ssrPass.groundReflector = groundReflector), (ssrPass.selects = selects);
        } else {
          (ssrPass.groundReflector = null), (ssrPass.selects = null);
        }
      });
      ssrPass.thickness = 0.018;
      gui.add(ssrPass, 'thickness').min(0).max(0.1).step(0.0001);
      ssrPass.infiniteThick = false;
      gui.add(ssrPass, 'infiniteThick');
      gui.add(params, 'autoRotate').onChange(() => {
        controls.enabled = !params.autoRotate;
      });

      const folder = gui.addFolder('more settings');
      folder.add(ssrPass, 'fresnel').onChange(() => {
        groundReflector.fresnel = ssrPass.fresnel;
      });
      folder.add(ssrPass, 'distanceAttenuation').onChange(() => {
        groundReflector.distanceAttenuation = ssrPass.distanceAttenuation;
      });
      ssrPass.maxDistance = 0.1;
      groundReflector.maxDistance = ssrPass.maxDistance;
      folder
        .add(ssrPass, 'maxDistance')
        .min(0)
        .max(0.5)
        .step(0.001)
        .onChange(() => {
          groundReflector.maxDistance = ssrPass.maxDistance;
        });
      folder.add(params, 'otherMeshes').onChange(() => {
        if (params.otherMeshes) {
          otherMeshes.forEach((mesh) => (mesh.visible = true));
        } else {
          otherMeshes.forEach((mesh) => (mesh.visible = false));
        }
      });
      folder.add(ssrPass, 'bouncing');
      folder
        .add(ssrPass, 'output', {
          Default: SSRPass.OUTPUT.Default,
          'SSR Only': SSRPass.OUTPUT.SSR,
          Beauty: SSRPass.OUTPUT.Beauty,
          Depth: SSRPass.OUTPUT.Depth,
          Normal: SSRPass.OUTPUT.Normal,
          Metalness: SSRPass.OUTPUT.Metalness
        })
        .onChange(function (value) {
          ssrPass.output = value;
        });
      ssrPass.opacity = 1;
      groundReflector.opacity = ssrPass.opacity;
      folder
        .add(ssrPass, 'opacity')
        .min(0)
        .max(1)
        .onChange(() => {
          groundReflector.opacity = ssrPass.opacity;
        });
      folder.add(ssrPass, 'blur');
      // folder.open()
      // gui.close()
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      groundReflector.getRenderTarget().setSize(window.innerWidth, window.innerHeight);
      groundReflector.resolution.set(window.innerWidth, window.innerHeight);
    }

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      if (params.autoRotate) {
        const timer = Date.now() * 0.0003;

        camera.position.x = Math.sin(timer) * 0.5;
        camera.position.y = 0.2135;
        camera.position.z = Math.cos(timer) * 0.5;
        camera.lookAt(0, 0.0635, 0);
      } else {
        controls.update();
      }

      if (params.enableSSR) {
        // TODO: groundReflector has full ground info, need use it to solve reflection gaps problem on objects when camera near ground.
        // TODO: the normal and depth info where groundReflector reflected need to be changed.
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    }

    needToDispose(() => [renderer, dracoLoader, scene, controls, composer]);
  }
};
export { exampleInfo as default };
