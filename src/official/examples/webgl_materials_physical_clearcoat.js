import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_physical_clearcoat',
  useLoaders: { HDRCubeTextureLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - materials - clearcoat'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    let particleLight;
    let group;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.25, 50);
      camera.position.z = 10;

      scene = new THREE.Scene();

      group = new THREE.Group();
      scene.add(group);

      new HDRCubeTextureLoader()
        .setPath('textures/cube/pisaHDR/')
        .load(['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'], function (texture) {
          const geometry = new THREE.SphereGeometry(0.8, 64, 32);

          const textureLoader = new THREE.TextureLoader();

          const diffuse = textureLoader.load('textures/carbon/Carbon.png');
          diffuse.colorSpace = THREE.SRGBColorSpace;
          diffuse.wrapS = THREE.RepeatWrapping;
          diffuse.wrapT = THREE.RepeatWrapping;
          diffuse.repeat.x = 10;
          diffuse.repeat.y = 10;

          const normalMap = textureLoader.load('textures/carbon/Carbon_Normal.png');
          normalMap.wrapS = THREE.RepeatWrapping;
          normalMap.wrapT = THREE.RepeatWrapping;
          normalMap.repeat.x = 10;
          normalMap.repeat.y = 10;

          const normalMap2 = textureLoader.load('textures/water/Water_1_M_Normal.jpg');

          const normalMap3 = new THREE.CanvasTexture(new FlakesTexture());
          normalMap3.wrapS = THREE.RepeatWrapping;
          normalMap3.wrapT = THREE.RepeatWrapping;
          normalMap3.repeat.x = 10;
          normalMap3.repeat.y = 6;
          normalMap3.anisotropy = 16;

          const normalMap4 = textureLoader.load('textures/golfball.jpg');

          const clearcoatNormalMap = textureLoader.load(
            'textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png'
          );

          // car paint

          let material = new THREE.MeshPhysicalMaterial({
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            metalness: 0.9,
            roughness: 0.5,
            color: 0x0000ff,
            normalMap: normalMap3,
            normalScale: new THREE.Vector2(0.15, 0.15)
          });

          let mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = -1;
          mesh.position.y = 1;
          group.add(mesh);

          // fibers

          material = new THREE.MeshPhysicalMaterial({
            roughness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            map: diffuse,
            normalMap: normalMap
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = 1;
          mesh.position.y = 1;
          group.add(mesh);

          // golf

          material = new THREE.MeshPhysicalMaterial({
            metalness: 0.0,
            roughness: 0.1,
            clearcoat: 1.0,
            normalMap: normalMap4,
            clearcoatNormalMap: clearcoatNormalMap,

            // y scale is negated to compensate for normal map handedness.
            clearcoatNormalScale: new THREE.Vector2(2.0, -2.0)
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = -1;
          mesh.position.y = -1;
          group.add(mesh);

          // clearcoat + normalmap

          material = new THREE.MeshPhysicalMaterial({
            clearcoat: 1.0,
            metalness: 1.0,
            color: 0xff0000,
            normalMap: normalMap2,
            normalScale: new THREE.Vector2(0.15, 0.15),
            clearcoatNormalMap: clearcoatNormalMap,

            // y scale is negated to compensate for normal map handedness.
            clearcoatNormalScale: new THREE.Vector2(2.0, -2.0)
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = 1;
          mesh.position.y = -1;
          group.add(mesh);

          //

          scene.background = texture;
          scene.environment = texture;
        });

      // LIGHTS

      particleLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      scene.add(particleLight);

      particleLight.add(new THREE.PointLight(0xffffff, 30));

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      //

      //

      stats = new Stats(renderer);

      // EVENTS

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 3;
      controls.maxDistance = 30;

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    //

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    //

    function animate() {
      render();

      stats.update();
    }

    function render() {
      const timer = Date.now() * 0.00025;

      particleLight.position.x = Math.sin(timer * 7) * 3;
      particleLight.position.y = Math.cos(timer * 5) * 4;
      particleLight.position.z = Math.cos(timer * 3) * 3;

      for (let i = 0; i < group.children.length; i++) {
        const child = group.children[i];
        child.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
