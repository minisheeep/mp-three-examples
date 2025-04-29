import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_controls_transform',
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
        content: '- transform controls'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let cameraPersp, cameraOrtho, currentCamera;
    let scene, renderer, control, orbit;

    init();
    render();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const aspect = window.innerWidth / window.innerHeight;

      const frustumSize = 5;

      cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
      cameraOrtho = new THREE.OrthographicCamera(
        -frustumSize * aspect,
        frustumSize * aspect,
        frustumSize,
        -frustumSize,
        0.1,
        100
      );
      currentCamera = cameraPersp;

      currentCamera.position.set(5, 2.5, 5);

      scene = new THREE.Scene();
      scene.add(new THREE.GridHelper(5, 10, 0x888888, 0x444444));

      const ambientLight = new THREE.AmbientLight(0xffffff);
      scene.add(ambientLight);

      const light = new THREE.DirectionalLight(0xffffff, 4);
      light.position.set(1, 1, 1);
      scene.add(light);

      const texture = new THREE.TextureLoader().load('textures/crate.gif', render);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshLambertMaterial({ map: texture });

      orbit = new OrbitControls(currentCamera, renderer.domElement);
      orbit.update();
      orbit.addEventListener('change', render);

      control = new TransformControls(currentCamera, renderer.domElement);
      control.addEventListener('change', render);

      control.addEventListener('dragging-changed', function (event) {
        orbit.enabled = !event.value;
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      control.attach(mesh);
      if (control.isObject3D) {
        scene.add(control);
      } else {
        //兼容高版本
        const gizmo = control.getHelper();
        scene.add(gizmo);
      }

      window.addEventListener('resize', onWindowResize);

      const state = {
        enabled: true,
        mode: control.mode,
        snap: false,
        reset() {
          control.reset();
        },
        size: control.size,
        space: control.space,
        toggleCamera() {
          const position = currentCamera.position.clone();

          currentCamera = currentCamera.isPerspectiveCamera ? cameraOrtho : cameraPersp;
          currentCamera.position.copy(position);

          orbit.object = currentCamera;
          control.camera = currentCamera;

          currentCamera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
          onWindowResize();
        },
        randomZoom() {
          const randomFoV = Math.random() + 0.1;
          const randomZoom = Math.random() + 0.1;

          cameraPersp.fov = randomFoV * 160;
          cameraOrtho.bottom = -randomFoV * 500;
          cameraOrtho.top = randomFoV * 500;

          cameraPersp.zoom = randomZoom * 5;
          cameraOrtho.zoom = randomZoom * 5;
          onWindowResize();
        }
      };
      const gui = new GUI();
      gui.add(control, 'enabled');
      gui.add(state, 'mode', ['translate', 'rotate', 'scale']).onChange((mode) => {
        control.setMode(mode);
      });
      gui
        .add(state, 'snap')
        .name('snap to grid')
        .onChange((snap) => {
          if (snap) {
            control.setTranslationSnap(1);
            control.setRotationSnap(THREE.MathUtils.degToRad(15));
            control.setScaleSnap(0.25);
          } else {
            control.setTranslationSnap(null);
            control.setRotationSnap(null);
            control.setScaleSnap(null);
          }
        });
      gui.add(state, 'size', 0.1, 5, 0.1).onChange((size) => {
        control.setSize(size);
      });
      gui.add(state, 'space', ['local', 'world']).onChange((space) => {
        control.setSpace(space);
      });
      gui.add(control, 'showX');
      gui.add(control, 'showY');
      gui.add(control, 'showZ');
      gui.add(state, 'toggleCamera').name('toggle camera');
      gui.add(state, 'randomZoom').name('random zoom');
      gui.add(state, 'reset');

      needToDispose(renderer, control, scene);
    }

    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;

      cameraPersp.aspect = aspect;
      cameraPersp.updateProjectionMatrix();

      cameraOrtho.left = cameraOrtho.bottom * aspect;
      cameraOrtho.right = cameraOrtho.top * aspect;
      cameraOrtho.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      render();
    }

    function render() {
      renderer.render(scene, currentCamera);
    }
  }
};
export { exampleInfo as default };
