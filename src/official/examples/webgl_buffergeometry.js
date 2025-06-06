import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry',
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
        content: 'webgl - buffergeometry'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    let mesh;

    init();
    animate();

    function init() {
      //

      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
      camera.position.z = 2750;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505);
      scene.fog = new THREE.Fog(0x050505, 2000, 3500);

      //

      scene.add(new THREE.AmbientLight(0xcccccc));

      const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
      light1.position.set(1, 1, 1);
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 4.5);
      light2.position.set(0, -1, 0);
      scene.add(light2);

      //

      const triangles = 160000;

      const geometry = new THREE.BufferGeometry();

      const positions = [];
      const normals = [];
      const colors = [];

      const color = new THREE.Color();

      const n = 800,
        n2 = n / 2; // triangles spread in the cube
      const d = 12,
        d2 = d / 2; // individual triangle size

      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();
      const pC = new THREE.Vector3();

      const cb = new THREE.Vector3();
      const ab = new THREE.Vector3();

      for (let i = 0; i < triangles; i++) {
        // positions

        const x = Math.random() * n - n2;
        const y = Math.random() * n - n2;
        const z = Math.random() * n - n2;

        const ax = x + Math.random() * d - d2;
        const ay = y + Math.random() * d - d2;
        const az = z + Math.random() * d - d2;

        const bx = x + Math.random() * d - d2;
        const by = y + Math.random() * d - d2;
        const bz = z + Math.random() * d - d2;

        const cx = x + Math.random() * d - d2;
        const cy = y + Math.random() * d - d2;
        const cz = z + Math.random() * d - d2;

        positions.push(ax, ay, az);
        positions.push(bx, by, bz);
        positions.push(cx, cy, cz);

        // flat face normals

        pA.set(ax, ay, az);
        pB.set(bx, by, bz);
        pC.set(cx, cy, cz);

        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);

        cb.normalize();

        const nx = cb.x;
        const ny = cb.y;
        const nz = cb.z;

        normals.push(nx, ny, nz);
        normals.push(nx, ny, nz);
        normals.push(nx, ny, nz);

        // colors

        const vx = x / n + 0.5;
        const vy = y / n + 0.5;
        const vz = z / n + 0.5;

        color.setRGB(vx, vy, vz);

        const alpha = Math.random();

        colors.push(color.r, color.g, color.b, alpha);
        colors.push(color.r, color.g, color.b, alpha);
        colors.push(color.r, color.g, color.b, alpha);
      }

      function disposeArray() {
        this.array = null;
      }

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3).onUpload(disposeArray)
      );
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3).onUpload(disposeArray)
      );
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 4).onUpload(disposeArray)
      );

      geometry.computeBoundingSphere();

      const material = new THREE.MeshPhongMaterial({
        color: 0xd5d5d5,
        specular: 0xffffff,
        shininess: 250,
        side: THREE.DoubleSide,
        vertexColors: true,
        transparent: true
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
