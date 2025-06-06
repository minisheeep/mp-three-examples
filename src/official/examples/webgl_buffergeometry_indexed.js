import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_indexed',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - buffergeometry - indexed'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats;

    let mesh;

    init();

    function init() {
      //

      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
      camera.position.z = 64;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505);

      //

      const light = new THREE.HemisphereLight();
      light.intensity = 3;
      scene.add(light);

      //

      const geometry = new THREE.BufferGeometry();

      const indices = [];

      const vertices = [];
      const normals = [];
      const colors = [];

      const size = 20;
      const segments = 10;

      const halfSize = size / 2;
      const segmentSize = size / segments;

      const _color = new THREE.Color();

      // generate vertices, normals and color data for a simple grid geometry

      for (let i = 0; i <= segments; i++) {
        const y = i * segmentSize - halfSize;

        for (let j = 0; j <= segments; j++) {
          const x = j * segmentSize - halfSize;

          vertices.push(x, -y, 0);
          normals.push(0, 0, 1);

          const r = x / size + 0.5;
          const g = y / size + 0.5;

          _color.setRGB(r, g, 1, THREE.SRGBColorSpace);

          colors.push(_color.r, _color.g, _color.b);
        }
      }

      // generate indices (data for element array buffer)

      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
          const a = i * (segments + 1) + (j + 1);
          const b = i * (segments + 1) + j;
          const c = (i + 1) * (segments + 1) + j;
          const d = (i + 1) * (segments + 1) + (j + 1);

          // generate two faces (triangles) per iteration

          indices.push(a, b, d); // face one
          indices.push(b, c, d); // face two
        }
      }

      //

      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: true
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      stats = new Stats(renderer);

      //

      const gui = new GUI();
      gui.add(material, 'wireframe');

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      const time = Date.now() * 0.001;

      mesh.rotation.x = time * 0.25;
      mesh.rotation.y = time * 0.5;

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
