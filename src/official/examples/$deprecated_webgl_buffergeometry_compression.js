import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as GeometryCompressionUtils from 'three/examples/jsm/utils/GeometryCompressionUtils.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_compression',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      {
        tag: 'text',
        content: '- BufferGeometry Compression'
      }
    ],
    [{ tag: 'text', content: 'Octahedron and Quantization encoding methods from Tarek Sherif' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, gui;

    let camera, scene, renderer, controls;

    const lights = [];

    // options
    const data = {
      model: 'Icosahedron',
      wireframe: false,
      texture: false,
      detail: 4,

      QuantizePosEncoding: false,
      NormEncodingMethods: 'None', // for normal encodings
      DefaultUVEncoding: false,

      totalGPUMemory: '0 bytes'
    };
    let memoryDisplay;

    // geometry params
    const radius = 100;

    // materials
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.8
    });
    const meshMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });

    // texture
    const texture = new THREE.TextureLoader().load('textures/uv_grid_opengl.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    //
    init();

    function init() {
      //

      //

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.setScalar(2 * radius);

      //

      scene.add(new THREE.AmbientLight(0xffffff, 0.3));

      lights[0] = new THREE.DirectionalLight(0xffffff, 2.5);
      lights[1] = new THREE.DirectionalLight(0xffffff, 2.5);
      lights[2] = new THREE.DirectionalLight(0xffffff, 2.5);

      lights[0].position.set(0, 2 * radius, 0);
      lights[1].position.set(2 * radius, -2 * radius, 2 * radius);
      lights[2].position.set(-2 * radius, -2 * radius, -2 * radius);

      scene.add(lights[0]);
      scene.add(lights[1]);
      scene.add(lights[2]);

      //

      scene.add(new THREE.AxesHelper(radius * 5));

      //

      let geom = newGeometry(data);

      const mesh = new THREE.Mesh(geom, meshMaterial);
      scene.add(mesh);

      const lineSegments = new THREE.LineSegments(new THREE.WireframeGeometry(geom), lineMaterial);
      lineSegments.visible = data.wireframe;

      scene.add(lineSegments);

      //

      gui = new GUI();

      function newGeometry(data) {
        switch (data.model) {
          case 'Icosahedron':
            return new THREE.IcosahedronGeometry(radius, data.detail);
          case 'Cylinder':
            return new THREE.CylinderGeometry(radius / 1.5, radius / 1.5, radius, data.detail * 6);
          case 'Teapot':
            return new TeapotGeometry(radius / 1.5, data.detail * 3, true, true, true, true, true);
          case 'TorusKnot':
            return new THREE.TorusKnotGeometry(
              radius / 2,
              10,
              data.detail * 30,
              data.detail * 6,
              3,
              4
            );
        }
      }

      function generateGeometry() {
        geom = newGeometry(data);

        updateGroupGeometry(mesh, lineSegments, geom, data);
      }

      function updateLineSegments() {
        lineSegments.visible = data.wireframe;
      }

      let folder = gui.addFolder('Scene');
      folder
        .add(data, 'model', ['Icosahedron', 'Cylinder', 'TorusKnot', 'Teapot'])
        .onChange(generateGeometry);
      folder.add(data, 'wireframe', false).onChange(updateLineSegments);
      folder.add(data, 'texture', false).onChange(generateGeometry);
      folder.add(data, 'detail', 1, 8, 1).onChange(generateGeometry);
      folder.open();

      folder = gui.addFolder('Position Compression');
      folder.add(data, 'QuantizePosEncoding', false).onChange(generateGeometry);
      folder.open();

      folder = gui.addFolder('Normal Compression');
      folder
        .add(data, 'NormEncodingMethods', ['None', 'DEFAULT', 'OCT1Byte', 'OCT2Byte', 'ANGLES'])
        .onChange(generateGeometry);
      folder.open();

      folder = gui.addFolder('UV Compression');
      folder.add(data, 'DefaultUVEncoding', false).onChange(generateGeometry);
      folder.open();

      folder = gui.addFolder('Memory Info');
      folder.open();
      memoryDisplay = folder.add(data, 'totalGPUMemory', '0 bytes');
      computeGPUMemory(mesh);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;

      //

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    //

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();
    }

    //

    function animate() {
      renderer.render(scene, camera);

      stats.update();
    }

    //

    function updateGroupGeometry(mesh, lineSegments, geometry, data) {
      // dispose first

      lineSegments.geometry.dispose();
      mesh.geometry.dispose();
      mesh.material.dispose();
      if (mesh.material.map) mesh.material.map.dispose();

      lineSegments.geometry = new THREE.WireframeGeometry(geometry);
      mesh.geometry = geometry;
      mesh.material = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      mesh.material.map = data.texture ? texture : null;

      if (data['QuantizePosEncoding']) {
        GeometryCompressionUtils.compressPositions(mesh);
      }

      if (data['NormEncodingMethods'] !== 'None') {
        GeometryCompressionUtils.compressNormals(mesh, data['NormEncodingMethods']);
      }

      if (data['DefaultUVEncoding']) {
        GeometryCompressionUtils.compressUvs(mesh);
      }

      computeGPUMemory(mesh);
    }

    function computeGPUMemory(mesh) {
      // Use BufferGeometryUtils to do memory calculation

      memoryDisplay.setValue(BufferGeometryUtils.estimateBytesUsed(mesh.geometry) + ' bytes');
    }
  }
};
export { exampleInfo as default };
