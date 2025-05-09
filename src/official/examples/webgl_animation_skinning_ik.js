import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CCDIKHelper, CCDIKSolver } from 'three/examples/jsm/animation/CCDIKSolver.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_animation_skinning_ik',
  useLoaders: { GLTFLoader, DRACOLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- webgl - inverse kinematics'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, DecoderPath }) => {
    let scene, camera, renderer, orbitControls, transformControls;
    let mirrorSphereCamera;

    const OOI = {};
    let IKSolver;

    let stats, gui, conf;
    const v0 = new THREE.Vector3();

    init();

    async function init() {
      conf = {
        followSphere: false,
        turnHead: true,
        ik_solver: true,
        update: updateIK
      };

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xffffff, 0.17);
      scene.background = new THREE.Color(0xffffff);

      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.001, 5000);
      camera.position.set(0.9728517749133652, 1.1044765132727201, 0.7316689528482836);
      camera.lookAt(scene.position);
      window.addEventListener('resize', onWindowResize, false);

      const ambientLight = new THREE.AmbientLight(0xffffff, 8); // soft white light
      scene.add(ambientLight);

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DecoderPath.GLTF);
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      const gltf = await gltfLoader.loadAsync('models/gltf/kira.glb');
      gltf.scene.traverse((n) => {
        if (n.name === 'head') OOI.head = n;
        if (n.name === 'lowerarm_l') OOI.lowerarm_l = n;
        if (n.name === 'Upperarm_l') OOI.Upperarm_l = n;
        if (n.name === 'hand_l') OOI.hand_l = n;
        if (n.name === 'target_hand_l') OOI.target_hand_l = n;

        if (n.name === 'boule') OOI.sphere = n;
        if (n.name === 'Kira_Shirt_left') OOI.kira = n;
      });
      scene.add(gltf.scene);

      const targetPosition = OOI.sphere.position.clone(); // for orbit controls
      OOI.hand_l.attach(OOI.sphere);

      // mirror sphere cube-camera
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
      mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget);
      scene.add(mirrorSphereCamera);
      const mirrorSphereMaterial = new THREE.MeshBasicMaterial({
        envMap: cubeRenderTarget.texture
      });
      OOI.sphere.material = mirrorSphereMaterial;

      OOI.kira.add(OOI.kira.skeleton.bones[0]);
      const iks = [
        {
          target: 22, // "target_hand_l"
          effector: 6, // "hand_l"
          links: [
            {
              index: 5, // "lowerarm_l"
              rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
              rotationMax: new THREE.Vector3(1.7, -1.1, 0.3)
            },
            {
              index: 4, // "Upperarm_l"
              rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
              rotationMax: new THREE.Vector3(1.1, 0, -1.4)
            }
          ]
        }
      ];
      IKSolver = new CCDIKSolver(OOI.kira, iks);
      const ccdikhelper = new CCDIKHelper(OOI.kira, iks, 0.01);
      scene.add(ccdikhelper);

      gui = new GUI();
      gui.add(conf, 'followSphere').name('follow sphere');
      gui.add(conf, 'turnHead').name('turn head');
      gui.add(conf, 'ik_solver').name('IK auto update');
      gui.add(conf, 'update').name('IK manual update()');
      gui.open();

      //
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);

      //

      orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.minDistance = 0.2;
      orbitControls.maxDistance = 1.5;
      orbitControls.enableDamping = true;
      orbitControls.target.copy(targetPosition);

      transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.size = 0.75;
      transformControls.showX = false;
      transformControls.space = 'world';
      transformControls.attach(OOI.target_hand_l);
      if (transformControls.isObject3D) {
        scene.add(transformControls);
      } else {
        //兼容高版本
        const gizmo = transformControls.getHelper();
        scene.add(gizmo);
      }

      // disable orbitControls while using transformControls
      transformControls.addEventListener('mouseDown', () => (orbitControls.enabled = false));
      transformControls.addEventListener('mouseUp', () => (orbitControls.enabled = true));

      //

      stats = new Stats(renderer);

      needToDispose(() => [
        renderer,
        scene,
        orbitControls,
        transformControls,
        mirrorSphereCamera,
        gltfLoader,
        dracoLoader
      ]);
    }

    function animate() {
      if (OOI.sphere && mirrorSphereCamera) {
        OOI.sphere.visible = false;
        OOI.sphere.getWorldPosition(mirrorSphereCamera.position);
        mirrorSphereCamera.update(renderer, scene);
        OOI.sphere.visible = true;
      }

      if (OOI.sphere && conf.followSphere) {
        // orbitControls follows the sphere
        OOI.sphere.getWorldPosition(v0);
        orbitControls.target.lerp(v0, 0.1);
      }

      if (OOI.head && OOI.sphere && conf.turnHead) {
        // turn head
        OOI.sphere.getWorldPosition(v0);
        OOI.head.lookAt(v0);
        OOI.head.rotation.set(
          OOI.head.rotation.x,
          OOI.head.rotation.y + Math.PI,
          OOI.head.rotation.z
        );
      }

      if (conf.ik_solver) {
        updateIK();
      }

      orbitControls.update();
      renderer.render(scene, camera);

      stats.update(); // fps stats
    }

    function updateIK() {
      if (IKSolver) IKSolver.update();

      scene.traverse(function (object) {
        if (object.isSkinnedMesh) object.computeBoundingSphere();
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer?.setSize(window.innerWidth, window.innerHeight);
    }
  }
};
export { exampleInfo as default };
