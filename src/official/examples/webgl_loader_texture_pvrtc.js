import * as THREE from 'three';
import { PVRLoader } from 'three/examples/jsm/loaders/PVRLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_pvrtc',
  useLoaders: { PVRLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- webgl - PVR compressed textures'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    const meshes = [];

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 1000;

      scene = new THREE.Scene();

      const geometry = new THREE.BoxGeometry(200, 200, 200);

      //

      const onCube1Loaded = function (texture) {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.mapping = THREE.CubeReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        material6.needsUpdate = true;
      };

      const onCube2Loaded = function (texture) {
        texture.magFilter = THREE.LinearFilter;
        // texture.minFilter = LinearMipmapNearestFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.mapping = THREE.CubeReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        material8.needsUpdate = true;
      };

      //

      const loader = new PVRLoader();

      const disturb_4bpp_rgb = loader.load('textures/compressed/disturb_4bpp_rgb.pvr');
      const disturb_4bpp_rgb_v3 = loader.load('textures/compressed/disturb_4bpp_rgb_v3.pvr');
      const disturb_4bpp_rgb_mips = loader.load('textures/compressed/disturb_4bpp_rgb_mips.pvr');
      const disturb_2bpp_rgb = loader.load('textures/compressed/disturb_2bpp_rgb.pvr');
      const flare_4bpp_rgba = loader.load('textures/compressed/flare_4bpp_rgba.pvr');
      const flare_2bpp_rgba = loader.load('textures/compressed/flare_2bpp_rgba.pvr');
      const park3_cube_nomip_4bpp_rgb = loader.load(
        'textures/compressed/park3_cube_nomip_4bpp_rgb.pvr',
        onCube1Loaded
      );
      const park3_cube_mip_2bpp_rgb_v3 = loader.load(
        'textures/compressed/park3_cube_mip_2bpp_rgb_v3.pvr',
        onCube2Loaded
      );

      disturb_2bpp_rgb.minFilter =
        disturb_2bpp_rgb.magFilter =
        flare_4bpp_rgba.minFilter =
        flare_4bpp_rgba.magFilter =
        disturb_4bpp_rgb.minFilter =
        disturb_4bpp_rgb.magFilter =
        disturb_4bpp_rgb_v3.minFilter =
        disturb_4bpp_rgb_v3.magFilter =
        flare_2bpp_rgba.minFilter =
        flare_2bpp_rgba.magFilter =
          THREE.LinearFilter;

      disturb_2bpp_rgb.encoding =
        flare_4bpp_rgba.encoding =
        disturb_4bpp_rgb.encoding =
        disturb_4bpp_rgb_v3.encoding =
        flare_2bpp_rgba.colorSpace =
          THREE.SRGBColorSpace;

      const material1 = new THREE.MeshBasicMaterial({ map: disturb_4bpp_rgb });
      const material2 = new THREE.MeshBasicMaterial({ map: disturb_4bpp_rgb_mips });
      const material3 = new THREE.MeshBasicMaterial({ map: disturb_2bpp_rgb });
      const material4 = new THREE.MeshBasicMaterial({
        map: flare_4bpp_rgba,
        side: THREE.DoubleSide,
        depthTest: false,
        transparent: true
      });
      const material5 = new THREE.MeshBasicMaterial({
        map: flare_2bpp_rgba,
        side: THREE.DoubleSide,
        depthTest: false,
        transparent: true
      });
      const material6 = new THREE.MeshBasicMaterial({ envMap: park3_cube_nomip_4bpp_rgb });
      const material8 = new THREE.MeshBasicMaterial({ envMap: park3_cube_mip_2bpp_rgb_v3 });

      const material7 = new THREE.MeshBasicMaterial({ map: disturb_4bpp_rgb_v3 });

      //

      let mesh = new THREE.Mesh(geometry, material1);
      mesh.position.x = -500;
      mesh.position.y = 200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material2);
      mesh.position.x = -166;
      mesh.position.y = 200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material3);
      mesh.position.x = 166;
      mesh.position.y = 200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material7);
      mesh.position.x = 500;
      mesh.position.y = 200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material4);
      mesh.position.x = -500;
      mesh.position.y = -200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material5);
      mesh.position.x = -166;
      mesh.position.y = -200;
      scene.add(mesh);
      meshes.push(mesh);

      const torus = new THREE.TorusGeometry(100, 50, 32, 24);

      mesh = new THREE.Mesh(torus, material6);
      mesh.position.x = 166;
      mesh.position.y = -200;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(torus, material8);
      mesh.position.x = 500;
      mesh.position.y = -200;
      scene.add(mesh);
      meshes.push(mesh);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, loader);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const time = Date.now() * 0.001;

      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        mesh.rotation.x = time;
        mesh.rotation.y = time;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
