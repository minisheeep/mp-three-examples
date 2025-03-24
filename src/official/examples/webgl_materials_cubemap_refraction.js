import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_cubemap_refraction',
  useLoaders: [PLYLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'Three.js'
      },
      {
        tag: 'text',
        content: 'cube map refraction demo'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Lucy model from'
      },
      {
        tag: 'a',
        link: 'http://graphics.stanford.edu/data/3Dscanrep/',
        content: 'Stanford 3d scanning repository Texture by'
      },
      {
        tag: 'a',
        link: 'http://www.humus.name/index.php?page=Textures',
        content: 'Humus'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    let mouseX = 0,
      mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100000);
      camera.position.z = -4000;

      //

      const r = 'textures/cube/Park3Med/';

      const urls = [
        r + 'px.jpg',
        r + 'nx.jpg',
        r + 'py.jpg',
        r + 'ny.jpg',
        r + 'pz.jpg',
        r + 'nz.jpg'
      ];

      const textureCube = new THREE.CubeTextureLoader().load(urls);
      textureCube.mapping = THREE.CubeRefractionMapping;

      scene = new THREE.Scene();
      scene.background = textureCube;

      // LIGHTS

      const ambient = new THREE.AmbientLight(0xffffff, 3.5);
      scene.add(ambient);

      // material samples

      const cubeMaterial3 = new THREE.MeshPhongMaterial({
        color: 0xccddff,
        envMap: textureCube,
        refractionRatio: 0.98,
        reflectivity: 0.9
      });
      const cubeMaterial2 = new THREE.MeshPhongMaterial({
        color: 0xccfffd,
        envMap: textureCube,
        refractionRatio: 0.985
      });
      const cubeMaterial1 = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        envMap: textureCube,
        refractionRatio: 0.98
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      const loader = new PLYLoader();
      loader.load('models/ply/binary/Lucy100k.ply', function (geometry) {
        createScene(geometry, cubeMaterial1, cubeMaterial2, cubeMaterial3);
      });

      canvas.addEventListener('pointermove', onDocumentMouseMove);

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function createScene(geometry, m1, m2, m3) {
      geometry.computeVertexNormals();

      const s = 1.5;

      let mesh = new THREE.Mesh(geometry, m1);
      mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
      scene.add(mesh);

      mesh = new THREE.Mesh(geometry, m2);
      mesh.position.x = -1500;
      mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
      scene.add(mesh);

      mesh = new THREE.Mesh(geometry, m3);
      mesh.position.x = 1500;
      mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
      scene.add(mesh);
    }

    function onDocumentMouseMove(event) {
      mouseX = (event.clientX - windowHalfX) * 4;
      mouseY = (event.clientY - windowHalfY) * 4;
    }

    //

    function animate() {
      render();
      stats.update();
    }

    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;

      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
