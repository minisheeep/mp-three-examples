import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lut } from 'three/examples/jsm/math/Lut.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_geometry_colors_lookuptable',
  useLoaders: [],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: 'webgl - lookup table' }
    ],
    [{ tag: 'text', content: 'vertex color values from a range of data values' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let perpCamera, orthoCamera, renderer, lut;

    let mesh, sprite;
    let scene, uiScene;

    let params;

    init();

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      uiScene = new THREE.Scene();

      lut = new Lut();

      const width = window.innerWidth;
      const height = window.innerHeight;

      perpCamera = new THREE.PerspectiveCamera(60, width / height, 1, 100);
      perpCamera.position.set(0, 0, 10);
      scene.add(perpCamera);

      orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2);
      orthoCamera.position.set(0.5, 0, 1);

      sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(lut.createCanvas())
        })
      );
      sprite.material.map.colorSpace = THREE.SRGBColorSpace;
      sprite.scale.x = 0.125;
      uiScene.add(sprite);

      mesh = new THREE.Mesh(
        undefined,
        new THREE.MeshLambertMaterial({
          side: THREE.DoubleSide,
          color: 0xf5f5f5,
          vertexColors: true
        })
      );
      scene.add(mesh);

      params = {
        colorMap: 'rainbow'
      };
      loadModel();

      const pointLight = new THREE.PointLight(0xffffff, 3, 0, 0);
      perpCamera.add(pointLight);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.autoClear = false;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      window.addEventListener('resize', onWindowResize);

      const controls = new OrbitControls(perpCamera, renderer.domElement);
      controls.addEventListener('change', render);

      const gui = new GUI();

      gui
        .add(params, 'colorMap', ['rainbow', 'cooltowarm', 'blackbody', 'grayscale'])
        .onChange(function () {
          updateColors();
          render();
        });

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      perpCamera.aspect = width / height;
      perpCamera.updateProjectionMatrix();

      renderer.setSize(width, height);
      render();
    }

    function render() {
      renderer.clear();
      renderer.render(scene, perpCamera);
      renderer.render(uiScene, orthoCamera);
    }

    function loadModel() {
      const loader = new THREE.BufferGeometryLoader();
      loader.load('models/json/pressure.json', function (geometry) {
        geometry.center();
        geometry.computeVertexNormals();

        // default color attribute
        const colors = [];

        for (let i = 0, n = geometry.attributes.position.count; i < n; ++i) {
          colors.push(1, 1, 1);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        mesh.geometry = geometry;
        updateColors();

        render();
      });
    }

    function updateColors() {
      lut.setColorMap(params.colorMap);

      lut.setMax(2000);
      lut.setMin(0);

      const geometry = mesh.geometry;
      const pressures = geometry.attributes.pressure;
      const colors = geometry.attributes.color;
      const color = new THREE.Color();

      for (let i = 0; i < pressures.array.length; i++) {
        const colorValue = pressures.array[i];

        color.copy(lut.getColor(colorValue)).convertSRGBToLinear();

        colors.setXYZ(i, color.r, color.g, color.b);
      }

      colors.needsUpdate = true;

      const map = sprite.material.map;
      lut.updateCanvas(map.image);
      map.needsUpdate = true;
    }
  }
};
export { exampleInfo as default };
