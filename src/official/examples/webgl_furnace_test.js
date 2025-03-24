import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_furnace_test',
  useLoaders: [],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [
      {
        tag: 'a',
        link: 'https://google.github.io/filament/Filament.md.html#toc4.7.2',
        content: 'White Furnace'
      },
      { tag: 'text', content: 'energy conservation test by' },
      { tag: 'a', link: 'https://jsantell.com/', content: 'Jordan Santell' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose }) => {
    let scene, camera, renderer, radianceMap;

    const COLOR = 0xcccccc;

    function init() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      // renderer

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);

      window.addEventListener('resize', onWindowResize);

      canvas.addEventListener('pointerup', function () {
        scene.traverse(function (child) {
          if (child.isMesh) child.material.color.setHex(0xffffff);
        });

        render();
      });

      canvas.addEventListener('pointerdown', function () {
        scene.traverse(function (child) {
          if (child.isMesh) child.material.color.setHex(0xccccff); // tinted for visibility
        });

        render();
      });

      // scene

      scene = new THREE.Scene();

      // camera
      camera = new THREE.PerspectiveCamera(40, aspect, 1, 30);
      camera.position.set(0, 0, 18);
    }

    function createObjects() {
      const geometry = new THREE.SphereGeometry(0.4, 32, 16);

      for (let x = 0; x <= 10; x++) {
        for (let y = 0; y <= 10; y++) {
          const material = new THREE.MeshPhysicalMaterial({
            roughness: x / 10,
            metalness: y / 10,
            color: 0xffffff,
            envMap: radianceMap,
            envMapIntensity: 1,
            transmission: 0,
            ior: 1.5
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = x - 5;
          mesh.position.y = 5 - y;
          scene.add(mesh);
        }
      }
    }

    function createEnvironment() {
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(COLOR);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      radianceMap = pmremGenerator.fromScene(envScene).texture;
      pmremGenerator.dispose();

      scene.background = envScene.background;
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }

    Promise.resolve().then(init).then(createEnvironment).then(createObjects).then(render);
  }
};
export { exampleInfo as default };
