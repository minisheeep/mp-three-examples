import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_clipping_stencil',
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
        content: '- solid geometry with clip planes and stencil materials'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, object, stats;
    let planes, planeObjects, planeHelpers;
    let clock;

    const params = {
      animate: true,
      planeX: {
        constant: 0,
        negated: false,
        displayHelper: false
      },
      planeY: {
        constant: 0,
        negated: false,
        displayHelper: false
      },
      planeZ: {
        constant: 0,
        negated: false,
        displayHelper: false
      }
    };

    init();

    function createPlaneStencilGroup(geometry, plane, renderOrder) {
      const group = new THREE.Group();
      const baseMat = new THREE.MeshBasicMaterial();
      baseMat.depthWrite = false;
      baseMat.depthTest = false;
      baseMat.colorWrite = false;
      baseMat.stencilWrite = true;
      baseMat.stencilFunc = THREE.AlwaysStencilFunc;

      // back faces
      const mat0 = baseMat.clone();
      mat0.side = THREE.BackSide;
      mat0.clippingPlanes = [plane];
      mat0.stencilFail = THREE.IncrementWrapStencilOp;
      mat0.stencilZFail = THREE.IncrementWrapStencilOp;
      mat0.stencilZPass = THREE.IncrementWrapStencilOp;

      const mesh0 = new THREE.Mesh(geometry, mat0);
      mesh0.renderOrder = renderOrder;
      group.add(mesh0);

      // front faces
      const mat1 = baseMat.clone();
      mat1.side = THREE.FrontSide;
      mat1.clippingPlanes = [plane];
      mat1.stencilFail = THREE.DecrementWrapStencilOp;
      mat1.stencilZFail = THREE.DecrementWrapStencilOp;
      mat1.stencilZPass = THREE.DecrementWrapStencilOp;

      const mesh1 = new THREE.Mesh(geometry, mat1);
      mesh1.renderOrder = renderOrder;

      group.add(mesh1);

      return group;
    }

    function init() {
      clock = new THREE.Clock();

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 1, 100);
      camera.position.set(2, 2, 2);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(5, 10, 7.5);
      dirLight.castShadow = true;
      dirLight.shadow.camera.right = 2;
      dirLight.shadow.camera.left = -2;
      dirLight.shadow.camera.top = 2;
      dirLight.shadow.camera.bottom = -2;

      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      planes = [
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
      ];

      planeHelpers = planes.map((p) => new THREE.PlaneHelper(p, 2, 0xffffff));
      planeHelpers.forEach((ph) => {
        ph.visible = false;
        scene.add(ph);
      });

      const geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 220, 60);
      object = new THREE.Group();
      scene.add(object);

      // Set up clip plane rendering
      planeObjects = [];
      const planeGeom = new THREE.PlaneGeometry(4, 4);

      for (let i = 0; i < 3; i++) {
        const poGroup = new THREE.Group();
        const plane = planes[i];
        const stencilGroup = createPlaneStencilGroup(geometry, plane, i + 1);

        // plane is clipped by the other clipping planes
        const planeMat = new THREE.MeshStandardMaterial({
          color: 0xe91e63,
          metalness: 0.1,
          roughness: 0.75,
          clippingPlanes: planes.filter((p) => p !== plane),

          stencilWrite: true,
          stencilRef: 0,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp
        });
        const po = new THREE.Mesh(planeGeom, planeMat);
        po.onAfterRender = function (renderer) {
          renderer.clearStencil();
        };

        po.renderOrder = i + 1.1;

        object.add(stencilGroup);
        poGroup.add(po);
        planeObjects.push(po);
        scene.add(poGroup);
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xffc107,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes,
        clipShadows: true,
        shadowSide: THREE.DoubleSide
      });

      // add the color
      const clippedColorFront = new THREE.Mesh(geometry, material);
      clippedColorFront.castShadow = true;
      clippedColorFront.renderOrder = 6;
      object.add(clippedColorFront);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9, 1, 1),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25, side: THREE.DoubleSide })
      );

      ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
      ground.position.y = -1;
      ground.receiveShadow = true;
      scene.add(ground);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x263238);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      renderer.localClippingEnabled = true;
      // Stats
      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 2;
      controls.maxDistance = 20;
      controls.update();

      // GUI
      const gui = new GUI();
      gui.add(params, 'animate');

      const planeX = gui.addFolder('planeX');
      planeX.add(params.planeX, 'displayHelper').onChange((v) => (planeHelpers[0].visible = v));
      planeX
        .add(params.planeX, 'constant')
        .min(-1)
        .max(1)
        .onChange((d) => (planes[0].constant = d));
      planeX.add(params.planeX, 'negated').onChange(() => {
        planes[0].negate();
        params.planeX.constant = planes[0].constant;
      });
      planeX.open();

      const planeY = gui.addFolder('planeY');
      planeY.add(params.planeY, 'displayHelper').onChange((v) => (planeHelpers[1].visible = v));
      planeY
        .add(params.planeY, 'constant')
        .min(-1)
        .max(1)
        .onChange((d) => (planes[1].constant = d));
      planeY.add(params.planeY, 'negated').onChange(() => {
        planes[1].negate();
        params.planeY.constant = planes[1].constant;
      });
      planeY.open();

      const planeZ = gui.addFolder('planeZ');
      planeZ.add(params.planeZ, 'displayHelper').onChange((v) => (planeHelpers[2].visible = v));
      planeZ
        .add(params.planeZ, 'constant')
        .min(-1)
        .max(1)
        .onChange((d) => (planes[2].constant = d));
      planeZ.add(params.planeZ, 'negated').onChange(() => {
        planes[2].negate();
        params.planeZ.constant = planes[2].constant;
      });
      planeZ.open();
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const delta = clock.getDelta();

      if (params.animate) {
        object.rotation.x += delta * 0.5;
        object.rotation.y += delta * 0.2;
      }

      for (let i = 0; i < planeObjects.length; i++) {
        const plane = planes[i];
        const po = planeObjects[i];
        plane.coplanarPoint(po.position);
        po.lookAt(
          po.position.x - plane.normal.x,
          po.position.y - plane.normal.y,
          po.position.z - plane.normal.z
        );
      }

      stats.begin();
      renderer.render(scene, camera);
      stats.end();
      stats.update();
    }
  }
};
export { exampleInfo as default };
