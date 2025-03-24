import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_ttf',
  useLoaders: [TTFLoader],
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- TTFLoader using opentype by gero3' }
    ],
    [{ tag: 'text', content: 'type to enter new text, drag to spin the text' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, cameraTarget, scene, renderer;
    let group, textMesh1, textMesh2, textGeo, material;

    let text = 'three.js';
    const depth = 20,
      size = 70,
      hover = 30,
      curveSegments = 4,
      bevelThickness = 2,
      bevelSize = 1.5;

    let font = null;
    const mirror = true;

    let targetRotation = 0;
    let targetRotationOnPointerDown = 0;

    let pointerX = 0;
    let pointerXOnPointerDown = 0;

    let windowHalfX = window.innerWidth / 2;

    init();

    function init() {
      // CAMERA

      camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
      camera.position.set(0, 400, 700);

      cameraTarget = new THREE.Vector3(0, 150, 0);

      // SCENE

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 250, 1400);

      // LIGHTS

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
      dirLight1.position.set(0, 0, 1).normalize();
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xffffff, 2);
      dirLight2.position.set(0, hover, 10).normalize();
      dirLight2.color.setHSL(Math.random(), 1, 0.5, THREE.SRGBColorSpace);
      scene.add(dirLight2);

      material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

      group = new THREE.Group();
      group.position.y = 100;

      scene.add(group);

      const loader = new TTFLoader();

      loader.load('fonts/ttf/kenpixel.ttf', function (json) {
        font = new Font(json);
        createText();
      });

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10000, 10000),
        new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
      );
      plane.position.y = 100;
      plane.rotation.x = -Math.PI / 2;
      scene.add(plane);

      // RENDERER

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);

      // EVENTS

      canvas.addEventListener('pointerdown', onPointerDown);

      window.addEventListener('resize', onWindowResize);

      const options = {
        text: text
      };
      const gui = new GUI();
      gui.add(options, 'text').onChange((val) => {
        text = val;
        refreshText();
      });

      needToDispose(renderer, scene, loader);
    }

    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function createText() {
      textGeo = new TextGeometry(text, {
        font: font,

        size: size,
        depth: depth,
        curveSegments: curveSegments,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: true
      });

      textGeo.computeBoundingBox();
      textGeo.computeVertexNormals();

      const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

      textMesh1 = new THREE.Mesh(textGeo, material);

      textMesh1.position.x = centerOffset;
      textMesh1.position.y = hover;
      textMesh1.position.z = 0;

      textMesh1.rotation.x = 0;
      textMesh1.rotation.y = Math.PI * 2;

      group.add(textMesh1);

      if (mirror) {
        textMesh2 = new THREE.Mesh(textGeo, material);

        textMesh2.position.x = centerOffset;
        textMesh2.position.y = -hover;
        textMesh2.position.z = depth;

        textMesh2.rotation.x = Math.PI;
        textMesh2.rotation.y = Math.PI * 2;

        group.add(textMesh2);
      }
    }

    function refreshText() {
      group.remove(textMesh1);
      if (mirror) group.remove(textMesh2);

      if (!text) return;

      createText();
    }

    function onPointerDown(event) {
      if (event.isPrimary === false) return;

      pointerXOnPointerDown = event.clientX - windowHalfX;
      targetRotationOnPointerDown = targetRotation;

      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(event) {
      if (event.isPrimary === false) return;

      pointerX = event.clientX - windowHalfX;

      targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
    }

    function onPointerUp() {
      if (event.isPrimary === false) return;

      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    }

    //

    function animate() {
      group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
