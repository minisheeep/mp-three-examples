import * as THREE from 'three';
import * as Curves from 'three/examples/jsm/curves/CurveExtras.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_geometry_extrude_splines',
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
        content: '- spline extrusion examples'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer, splineCamera, cameraHelper, cameraEye;

    const direction = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const position = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    const pipeSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, -10),
      new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(30, 0, 10),
      new THREE.Vector3(30, 0, 20),
      new THREE.Vector3(20, 0, 30),
      new THREE.Vector3(10, 0, 30),
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(-10, 10, 30),
      new THREE.Vector3(-10, 20, 30),
      new THREE.Vector3(0, 30, 30),
      new THREE.Vector3(10, 30, 30),
      new THREE.Vector3(20, 30, 15),
      new THREE.Vector3(10, 30, 10),
      new THREE.Vector3(0, 30, 10),
      new THREE.Vector3(-10, 20, 10),
      new THREE.Vector3(-10, 10, 10),
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(10, -10, 10),
      new THREE.Vector3(20, -15, 10),
      new THREE.Vector3(30, -15, 10),
      new THREE.Vector3(40, -15, 10),
      new THREE.Vector3(50, -15, 10),
      new THREE.Vector3(60, 0, 10),
      new THREE.Vector3(70, 0, 0),
      new THREE.Vector3(80, 0, 0),
      new THREE.Vector3(90, 0, 0),
      new THREE.Vector3(100, 0, 0)
    ]);

    const sampleClosedSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -40, -40),
      new THREE.Vector3(0, 40, -40),
      new THREE.Vector3(0, 140, -40),
      new THREE.Vector3(0, 40, 40),
      new THREE.Vector3(0, -40, 40)
    ]);

    sampleClosedSpline.curveType = 'catmullrom';
    sampleClosedSpline.closed = true;

    // Keep a dictionary of Curve instances
    const splines = {
      GrannyKnot: new Curves.GrannyKnot(),
      HeartCurve: new Curves.HeartCurve(3.5),
      VivianiCurve: new Curves.VivianiCurve(70),
      KnotCurve: new Curves.KnotCurve(),
      HelixCurve: new Curves.HelixCurve(),
      TrefoilKnot: new Curves.TrefoilKnot(),
      TorusKnot: new Curves.TorusKnot(20),
      CinquefoilKnot: new Curves.CinquefoilKnot(20),
      TrefoilPolynomialKnot: new Curves.TrefoilPolynomialKnot(14),
      FigureEightPolynomialKnot: new Curves.FigureEightPolynomialKnot(),
      DecoratedTorusKnot4a: new Curves.DecoratedTorusKnot4a(),
      DecoratedTorusKnot4b: new Curves.DecoratedTorusKnot4b(),
      DecoratedTorusKnot5a: new Curves.DecoratedTorusKnot5a(),
      DecoratedTorusKnot5c: new Curves.DecoratedTorusKnot5c(),
      PipeSpline: pipeSpline,
      SampleClosedSpline: sampleClosedSpline
    };

    let parent, tubeGeometry, mesh;

    const params = {
      spline: 'GrannyKnot',
      scale: 4,
      extrusionSegments: 100,
      radiusSegments: 3,
      closed: true,
      animationView: false,
      lookAhead: false,
      cameraHelper: false
    };

    const material = new THREE.MeshLambertMaterial({ color: 0xff00ff });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.3,
      wireframe: true,
      transparent: true
    });

    function addTube() {
      if (mesh !== undefined) {
        parent.remove(mesh);
        mesh.geometry.dispose();
      }

      const extrudePath = splines[params.spline];

      tubeGeometry = new THREE.TubeGeometry(
        extrudePath,
        params.extrusionSegments,
        2,
        params.radiusSegments,
        params.closed
      );

      addGeometry(tubeGeometry);

      setScale();
    }

    function setScale() {
      mesh.scale.set(params.scale, params.scale, params.scale);
    }

    function addGeometry(geometry) {
      // 3D shape

      mesh = new THREE.Mesh(geometry, material);
      const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
      mesh.add(wireframe);

      parent.add(mesh);
    }

    function animateCamera() {
      cameraHelper.visible = params.cameraHelper;
      cameraEye.visible = params.cameraHelper;
    }

    init();

    function init() {
      // camera

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);
      camera.position.set(0, 50, 500);

      // scene

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // light

      scene.add(new THREE.AmbientLight(0xffffff));

      const light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(0, 0, 1);
      scene.add(light);

      // tube

      parent = new THREE.Object3D();
      scene.add(parent);

      splineCamera = new THREE.PerspectiveCamera(
        84,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      parent.add(splineCamera);

      cameraHelper = new THREE.CameraHelper(splineCamera);
      scene.add(cameraHelper);

      addTube();

      // debug camera

      cameraEye = new THREE.Mesh(
        new THREE.SphereGeometry(5),
        new THREE.MeshBasicMaterial({ color: 0xdddddd })
      );
      parent.add(cameraEye);

      cameraHelper.visible = params.cameraHelper;
      cameraEye.visible = params.cameraHelper;

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // stats

      stats = new Stats(renderer);

      // dat.GUI

      const gui = new GUI({ width: 285 });

      const folderGeometry = gui.addFolder('Geometry');
      folderGeometry.add(params, 'spline', Object.keys(splines)).onChange(function () {
        addTube();
      });
      folderGeometry
        .add(params, 'scale', 2, 10)
        .step(2)
        .onChange(function () {
          setScale();
        });
      folderGeometry
        .add(params, 'extrusionSegments', 50, 500)
        .step(50)
        .onChange(function () {
          addTube();
        });
      folderGeometry
        .add(params, 'radiusSegments', 2, 12)
        .step(1)
        .onChange(function () {
          addTube();
        });
      folderGeometry.add(params, 'closed').onChange(function () {
        addTube();
      });
      folderGeometry.open();

      const folderCamera = gui.addFolder('Camera');
      folderCamera.add(params, 'animationView').onChange(function () {
        animateCamera();
      });
      folderCamera.add(params, 'lookAhead').onChange(function () {
        animateCamera();
      });
      folderCamera.add(params, 'cameraHelper').onChange(function () {
        animateCamera();
      });
      folderCamera.open();

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 100;
      controls.maxDistance = 2000;

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      render();
      stats.update();
    }

    function render() {
      // animate camera along spline

      const time = Date.now();
      const looptime = 20 * 1000;
      const t = (time % looptime) / looptime;

      tubeGeometry.parameters.path.getPointAt(t, position);
      position.multiplyScalar(params.scale);

      // interpolation

      const segments = tubeGeometry.tangents.length;
      const pickt = t * segments;
      const pick = Math.floor(pickt);
      const pickNext = (pick + 1) % segments;

      binormal.subVectors(tubeGeometry.binormals[pickNext], tubeGeometry.binormals[pick]);
      binormal.multiplyScalar(pickt - pick).add(tubeGeometry.binormals[pick]);

      tubeGeometry.parameters.path.getTangentAt(t, direction);
      const offset = 15;

      normal.copy(binormal).cross(direction);

      // we move on a offset on its binormal

      position.add(normal.clone().multiplyScalar(offset));

      splineCamera.position.copy(position);
      cameraEye.position.copy(position);

      // using arclength for stablization in look ahead

      tubeGeometry.parameters.path.getPointAt(
        (t + 30 / tubeGeometry.parameters.path.getLength()) % 1,
        lookAt
      );
      lookAt.multiplyScalar(params.scale);

      // camera orientation 2 - up orientation via normal

      if (!params.lookAhead) lookAt.copy(position).add(direction);
      splineCamera.matrix.lookAt(splineCamera.position, lookAt, normal);
      splineCamera.quaternion.setFromRotationMatrix(splineCamera.matrix);

      cameraHelper.update();

      renderer.render(scene, params.animationView === true ? splineCamera : camera);
    }
  }
};
export { exampleInfo as default };
