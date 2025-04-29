import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { EdgeSplitModifier } from 'three/examples/jsm/modifiers/EdgeSplitModifier.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_modifier_edgesplit',
  useLoaders: { OBJLoader },
  info: [
    [
      {
        tag: 'a',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Edge Split modifier'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera;
    let modifier, mesh, baseGeometry;
    let map;

    const params = {
      smoothShading: true,
      edgeSplit: true,
      cutOffAngle: 20,
      showMap: false,
      tryKeepNormals: true
    };

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.rotateSpeed = 0.35;
      controls.minZoom = 1;
      camera.position.set(0, 0, 4);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 3));

      new OBJLoader().load('./models/obj/cerberus/Cerberus.obj', function (group) {
        const cerberus = group.children[0];
        const modelGeometry = cerberus.geometry;

        modifier = new EdgeSplitModifier();
        baseGeometry = BufferGeometryUtils.mergeVertices(modelGeometry);

        mesh = new THREE.Mesh(getGeometry(), new THREE.MeshStandardMaterial());
        mesh.material.flatShading = !params.smoothShading;
        mesh.rotateY(-Math.PI / 2);
        mesh.scale.set(3.5, 3.5, 3.5);
        mesh.translateZ(1.5);
        scene.add(mesh);

        if (map !== undefined && params.showMap) {
          mesh.material.map = map;
          mesh.material.needsUpdate = true;
        }

        render();
      });

      window.addEventListener('resize', onWindowResize);

      new THREE.TextureLoader().load('./models/obj/cerberus/Cerberus_A.jpg', function (texture) {
        map = texture;
        map.colorSpace = THREE.SRGBColorSpace;

        if (mesh !== undefined && params.showMap) {
          mesh.material.map = map;
          mesh.material.needsUpdate = true;
        }
      });

      const gui = new GUI({ title: 'Edge split modifier parameters' });

      gui.add(params, 'showMap').onFinishChange(updateMesh);
      gui.add(params, 'smoothShading').onFinishChange(updateMesh);
      gui.add(params, 'edgeSplit').onFinishChange(updateMesh);
      gui.add(params, 'cutOffAngle').min(0).max(180).onFinishChange(updateMesh);
      gui.add(params, 'tryKeepNormals').onFinishChange(updateMesh);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      render();
    }

    function getGeometry() {
      let geometry;

      if (params.edgeSplit) {
        geometry = modifier.modify(
          baseGeometry,
          (params.cutOffAngle * Math.PI) / 180,
          params.tryKeepNormals
        );
      } else {
        geometry = baseGeometry;
      }

      return geometry;
    }

    function updateMesh() {
      if (mesh !== undefined) {
        mesh.geometry = getGeometry();

        let needsUpdate = mesh.material.flatShading === params.smoothShading;
        mesh.material.flatShading = params.smoothShading === false;

        if (map !== undefined) {
          needsUpdate = needsUpdate || mesh.material.map !== (params.showMap ? map : null);
          mesh.material.map = params.showMap ? map : null;
        }

        mesh.material.needsUpdate = needsUpdate;

        render();
      }
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
