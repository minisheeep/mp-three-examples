import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_points_interleaved',
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
        content: 'webgl - buffergeometry - particles'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    let points;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 3500);
      camera.position.z = 2750;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505);
      scene.fog = new THREE.Fog(0x050505, 2000, 3500);

      //

      const particles = 500000;

      const geometry = new THREE.BufferGeometry();

      // create a generic buffer of binary data (a single particle has 16 bytes of data)

      const arrayBuffer = new ArrayBuffer(particles * 16);

      // the following typed arrays share the same buffer

      const interleavedFloat32Buffer = new Float32Array(arrayBuffer);
      const interleavedUint8Buffer = new Uint8Array(arrayBuffer);

      //

      const color = new THREE.Color();

      const n = 1000,
        n2 = n / 2; // particles spread in the cube

      for (let i = 0; i < interleavedFloat32Buffer.length; i += 4) {
        // position (first 12 bytes)

        const x = Math.random() * n - n2;
        const y = Math.random() * n - n2;
        const z = Math.random() * n - n2;

        interleavedFloat32Buffer[i + 0] = x;
        interleavedFloat32Buffer[i + 1] = y;
        interleavedFloat32Buffer[i + 2] = z;

        // color (last 4 bytes)

        const vx = x / n + 0.5;
        const vy = y / n + 0.5;
        const vz = z / n + 0.5;

        color.setRGB(vx, vy, vz, THREE.SRGBColorSpace);

        const j = (i + 3) * 4;

        interleavedUint8Buffer[j + 0] = color.r * 255;
        interleavedUint8Buffer[j + 1] = color.g * 255;
        interleavedUint8Buffer[j + 2] = color.b * 255;
        interleavedUint8Buffer[j + 3] = 0; // not needed
      }

      const interleavedBuffer32 = new THREE.InterleavedBuffer(interleavedFloat32Buffer, 4);
      const interleavedBuffer8 = new THREE.InterleavedBuffer(interleavedUint8Buffer, 16);

      geometry.setAttribute(
        'position',
        new THREE.InterleavedBufferAttribute(interleavedBuffer32, 3, 0, false)
      );
      geometry.setAttribute(
        'color',
        new THREE.InterleavedBufferAttribute(interleavedBuffer8, 3, 12, true)
      );

      //

      const material = new THREE.PointsMaterial({ size: 15, vertexColors: true });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      //

      renderer = new THREE.WebGLRenderer({ canvas });
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

      points.rotation.x = time * 0.25;
      points.rotation.y = time * 0.5;

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
