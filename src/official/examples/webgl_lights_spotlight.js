import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_lights_spotlight',
  useLoaders: { PLYLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - spotlight'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera;

    let spotLight, lightHelper;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(7, 4, 1);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.maxPolarAngle = Math.PI / 2;
      controls.target.set(0, 1, 0);
      controls.update();

      const ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.15);
      scene.add(ambient);

      const loader = new THREE.TextureLoader().setPath('textures/');
      const filenames = ['disturb.jpg', 'colors.png', 'uv_grid_opengl.jpg'];

      const textures = { none: null };

      for (let i = 0; i < filenames.length; i++) {
        const filename = filenames[i];

        const texture = loader.load(filename);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        textures[filename] = texture;
      }

      spotLight = new THREE.SpotLight(0xffffff, 100);
      spotLight.position.set(2.5, 5, 2.5);
      spotLight.angle = Math.PI / 6;
      spotLight.penumbra = 1;
      spotLight.decay = 2;
      spotLight.distance = 0;
      spotLight.map = textures['disturb.jpg'];

      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.camera.near = 1;
      spotLight.shadow.camera.far = 10;
      spotLight.shadow.focus = 1;
      scene.add(spotLight);

      lightHelper = new THREE.SpotLightHelper(spotLight);
      scene.add(lightHelper);

      //

      const geometry = new THREE.PlaneGeometry(200, 200);
      const material = new THREE.MeshLambertMaterial({ color: 0xbcbcbc });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -1, 0);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      scene.add(mesh);

      //

      new PLYLoader().load('models/ply/binary/Lucy100k.ply', function (geometry) {
        geometry.scale(0.0024, 0.0024, 0.0024);
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.y = -Math.PI / 2;
        mesh.position.y = 0.8;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      });

      window.addEventListener('resize', onWindowResize);

      // GUI

      const gui = new GUI();

      const params = {
        map: textures['disturb.jpg'],
        color: spotLight.color.getHex(),
        intensity: spotLight.intensity,
        distance: spotLight.distance,
        angle: spotLight.angle,
        penumbra: spotLight.penumbra,
        decay: spotLight.decay,
        focus: spotLight.shadow.focus,
        shadows: true
      };

      gui.add(params, 'map', textures).onChange(function (val) {
        spotLight.map = val;
      });

      gui.addColor(params, 'color').onChange(function (val) {
        spotLight.color.setHex(val);
      });

      gui.add(params, 'intensity', 0, 500).onChange(function (val) {
        spotLight.intensity = val;
      });

      gui.add(params, 'distance', 0, 20).onChange(function (val) {
        spotLight.distance = val;
      });

      gui.add(params, 'angle', 0, Math.PI / 3).onChange(function (val) {
        spotLight.angle = val;
      });

      gui.add(params, 'penumbra', 0, 1).onChange(function (val) {
        spotLight.penumbra = val;
      });

      gui.add(params, 'decay', 1, 2).onChange(function (val) {
        spotLight.decay = val;
      });

      gui.add(params, 'focus', 0, 1).onChange(function (val) {
        spotLight.shadow.focus = val;
      });

      gui.add(params, 'shadows').onChange(function (val) {
        renderer.shadowMap.enabled = val;

        scene.traverse(function (child) {
          if (child.material) {
            child.material.needsUpdate = true;
          }
        });
      });

      gui.open();

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const startTime = Date.now();

    function animate() {
      const time = (Date.now() - startTime) / 3000;

      spotLight.position.x = Math.cos(time) * 2.5;
      spotLight.position.z = Math.sin(time) * 2.5;

      lightHelper.update();

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
