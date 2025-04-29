import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_cubemap_mipmaps',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- cubemap customized mipmaps demo.' }
    ],
    [
      { tag: 'text', content: 'Left: webgl generated mipmaps' },
      { tag: 'text', content: 'Right: manual mipmaps' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    init();

    //load customized cube texture
    async function loadCubeTextureWithMipmaps() {
      const path = 'textures/cube/angus/';
      const format = '.jpg';
      const mipmaps = [];
      const maxLevel = 8;

      async function loadCubeTexture(urls) {
        return new Promise(function (resolve) {
          new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
            resolve(cubeTexture);
          });
        });
      }

      // load mipmaps
      const pendings = [];

      for (let level = 0; level <= maxLevel; ++level) {
        const urls = [];

        for (let face = 0; face < 6; ++face) {
          urls.push(path + 'cube_m0' + level + '_c0' + face + format);
        }

        const mipmapLevel = level;

        pendings.push(
          loadCubeTexture(urls).then(function (cubeTexture) {
            mipmaps[mipmapLevel] = cubeTexture;
          })
        );
      }

      await Promise.all(pendings);

      const customizedCubeTexture = mipmaps.shift();
      customizedCubeTexture.mipmaps = mipmaps;
      customizedCubeTexture.colorSpace = THREE.SRGBColorSpace;
      customizedCubeTexture.minFilter = THREE.LinearMipMapLinearFilter;
      customizedCubeTexture.magFilter = THREE.LinearFilter;
      customizedCubeTexture.generateMipmaps = false;
      customizedCubeTexture.needsUpdate = true;

      return customizedCubeTexture;
    }

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 500;

      scene = new THREE.Scene();

      loadCubeTextureWithMipmaps().then(function (cubeTexture) {
        //model
        const sphere = new THREE.SphereGeometry(100, 128, 128);

        //manual mipmaps
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: cubeTexture });
        material.name = 'manual mipmaps';

        let mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(100, 0, 0);
        scene.add(mesh);

        //webgl mipmaps
        material = material.clone();
        material.name = 'auto mipmaps';

        const autoCubeTexture = cubeTexture.clone();
        autoCubeTexture.mipmaps = [];
        autoCubeTexture.generateMipmaps = true;
        autoCubeTexture.needsUpdate = true;

        material.envMap = autoCubeTexture;

        mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(-100, 0, 0);
        scene.add(mesh);
      });

      //renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 1.5;

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
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
