import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water2.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_water',
  useLoaders: [],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- water'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose }) => {
    let scene, camera, clock, renderer, water;

    let torusKnot;

    const params = {
      color: '#ffffff',
      scale: 4,
      flowX: 1,
      flowY: 1
    };

    init();

    function init() {
      // scene

      scene = new THREE.Scene();

      // camera

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
      camera.position.set(-15, 7, 15);
      camera.lookAt(scene.position);

      // clock

      clock = new THREE.Clock();

      // mesh

      const torusKnotGeometry = new THREE.TorusKnotGeometry(3, 1, 256, 32);
      const torusKnotMaterial = new THREE.MeshNormalMaterial();

      torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
      torusKnot.position.y = 4;
      torusKnot.scale.set(0.5, 0.5, 0.5);
      scene.add(torusKnot);

      // ground

      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.4 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = Math.PI * -0.5;
      scene.add(ground);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('textures/hardwood2_diffuse.jpg', function (map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        map.repeat.set(4, 4);
        map.colorSpace = THREE.SRGBColorSpace;
        groundMaterial.map = map;
        groundMaterial.needsUpdate = true;
      });

      // water

      const waterGeometry = new THREE.PlaneGeometry(20, 20);

      water = new Water(waterGeometry, {
        color: params.color,
        scale: params.scale,
        flowDirection: new THREE.Vector2(params.flowX, params.flowY),
        textureWidth: 1024,
        textureHeight: 1024,
        normalMap0: textureLoader.load('textures/water/Water_1_M_Normal.jpg'),
        normalMap1: textureLoader.load('textures/water/Water_2_M_Normal.jpg')
      });

      water.position.y = 1;
      water.rotation.x = Math.PI * -0.5;
      scene.add(water);

      // skybox

      const cubeTextureLoader = new THREE.CubeTextureLoader();
      cubeTextureLoader.setPath('textures/cube/Park2/');

      const cubeTexture = cubeTextureLoader.load([
        'posx.jpg',
        'negx.jpg',
        'posy.jpg',
        'negy.jpg',
        'posz.jpg',
        'negz.jpg'
      ]);

      scene.background = cubeTexture;

      // light

      const ambientLight = new THREE.AmbientLight(0xe7e7e7, 1.2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(-1, 1, 1);
      scene.add(directionalLight);

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setAnimationLoop(animate);
      // gui

      const gui = new GUI();

      gui.addColor(params, 'color').onChange(function (value) {
        water.material.uniforms['color'].value.set(value);
      });
      gui.add(params, 'scale', 1, 10).onChange(function (value) {
        water.material.uniforms['config'].value.w = value;
      });
      gui
        .add(params, 'flowX', -1, 1)
        .step(0.01)
        .onChange(function (value) {
          water.material.uniforms['flowDirection'].value.x = value;
          water.material.uniforms['flowDirection'].value.normalize();
        });
      gui
        .add(params, 'flowY', -1, 1)
        .step(0.01)
        .onChange(function (value) {
          water.material.uniforms['flowDirection'].value.y = value;
          water.material.uniforms['flowDirection'].value.normalize();
        });

      gui.open();

      //

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 5;
      controls.maxDistance = 50;

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(() => [renderer, scene, controls, textureLoader, cubeTextureLoader]);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const delta = clock.getDelta();

      torusKnot.rotation.x += delta;
      torusKnot.rotation.y += delta * 0.5;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
