import * as THREE from 'three';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_texture_dds',
  useLoaders: { DDSLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl - compressed textures' }
    ],
    [
      { tag: 'text', content: 'leaf texture by' },
      { tag: 'a', link: 'http://opengameart.org/node/10505', content: 'lauris71' },
      { tag: 'text', content: ', explosion texture by' },
      { tag: 'a', link: 'http://opengameart.org/node/7728', content: 'bart' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    const meshes = [];

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 15;

      scene = new THREE.Scene();

      const geometry = new THREE.BoxGeometry(2, 2, 2);

      /*
This is how compressed textures are supposed to be used:

DXT1 - RGB - opaque textures
DXT3 - RGBA - transparent textures with sharp alpha transitions
DXT5 - RGBA - transparent textures with full alpha range
*/

      const loader = new DDSLoader();

      const map1 = loader.load('textures/compressed/disturb_dxt1_nomip.dds');
      map1.minFilter = map1.magFilter = THREE.LinearFilter;
      map1.anisotropy = 4;
      map1.colorSpace = THREE.SRGBColorSpace;

      const map2 = loader.load('textures/compressed/disturb_dxt1_mip.dds');
      map2.anisotropy = 4;
      map2.colorSpace = THREE.SRGBColorSpace;

      const map3 = loader.load('textures/compressed/hepatica_dxt3_mip.dds');
      map3.anisotropy = 4;
      map3.colorSpace = THREE.SRGBColorSpace;

      const map4 = loader.load('textures/compressed/explosion_dxt5_mip.dds');
      map4.anisotropy = 4;
      map4.colorSpace = THREE.SRGBColorSpace;

      const map5 = loader.load('textures/compressed/disturb_argb_nomip.dds');
      map5.minFilter = map5.magFilter = THREE.LinearFilter;
      map5.anisotropy = 4;
      map5.colorSpace = THREE.SRGBColorSpace;

      const map6 = loader.load('textures/compressed/disturb_argb_mip.dds');
      map6.anisotropy = 4;
      map6.colorSpace = THREE.SRGBColorSpace;

      const map7 = loader.load('textures/compressed/disturb_dx10_bc6h_signed_nomip.dds');
      map7.anisotropy = 4;

      const map8 = loader.load('textures/compressed/disturb_dx10_bc6h_signed_mip.dds');
      map8.anisotropy = 4;

      const map9 = loader.load('textures/compressed/disturb_dx10_bc6h_unsigned_nomip.dds');
      map9.anisotropy = 4;

      const map10 = loader.load('textures/compressed/disturb_dx10_bc6h_unsigned_mip.dds');
      map10.anisotropy = 4;

      const cubemap1 = loader.load('textures/compressed/Mountains.dds', function (texture) {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.mapping = THREE.CubeReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        material1.needsUpdate = true;
      });

      const cubemap2 = loader.load(
        'textures/compressed/Mountains_argb_mip.dds',
        function (texture) {
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;
          texture.mapping = THREE.CubeReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          material5.needsUpdate = true;
        }
      );

      const cubemap3 = loader.load(
        'textures/compressed/Mountains_argb_nomip.dds',
        function (texture) {
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;
          texture.mapping = THREE.CubeReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          material6.needsUpdate = true;
        }
      );

      const material1 = new THREE.MeshBasicMaterial({ map: map1, envMap: cubemap1 });
      const material2 = new THREE.MeshBasicMaterial({ map: map2 });
      const material3 = new THREE.MeshBasicMaterial({
        map: map3,
        alphaTest: 0.5,
        side: THREE.DoubleSide
      });
      const material4 = new THREE.MeshBasicMaterial({
        map: map4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });
      const material5 = new THREE.MeshBasicMaterial({ envMap: cubemap2 });
      const material6 = new THREE.MeshBasicMaterial({ envMap: cubemap3 });
      const material7 = new THREE.MeshBasicMaterial({ map: map5 });
      const material8 = new THREE.MeshBasicMaterial({ map: map6 });
      const material9 = new THREE.MeshBasicMaterial({ map: map7 });
      const material10 = new THREE.MeshBasicMaterial({ map: map8 });
      const material11 = new THREE.MeshBasicMaterial({ map: map9 });
      const material12 = new THREE.MeshBasicMaterial({ map: map10 });

      let mesh = new THREE.Mesh(new THREE.TorusGeometry(), material1);
      mesh.position.x = -10;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material2);
      mesh.position.x = -6;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material3);
      mesh.position.x = -6;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material4);
      mesh.position.x = -10;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material5);
      mesh.position.x = -2;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material6);
      mesh.position.x = -2;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material7);
      mesh.position.x = 2;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material8);
      mesh.position.x = 2;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material9);
      mesh.position.x = 6;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material10);
      mesh.position.x = 6;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material11);
      mesh.position.x = 10;
      mesh.position.y = -2;
      scene.add(mesh);
      meshes.push(mesh);

      mesh = new THREE.Mesh(geometry, material12);
      mesh.position.x = 10;
      mesh.position.y = 2;
      scene.add(mesh);
      meshes.push(mesh);

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
