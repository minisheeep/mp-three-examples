import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_clipping_advanced',
  useLoaders: {},
  info: [],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    function planesFromMesh(vertices, indices) {
      // creates a clipping volume from a convex triangular mesh
      // specified by the arrays 'vertices' and 'indices'

      const n = indices.length / 3,
        result = new Array(n);

      for (let i = 0, j = 0; i < n; ++i, j += 3) {
        const a = vertices[indices[j]],
          b = vertices[indices[j + 1]],
          c = vertices[indices[j + 2]];

        result[i] = new THREE.Plane().setFromCoplanarPoints(a, b, c);
      }

      return result;
    }

    function createPlanes(n) {
      // creates an array of n uninitialized plane objects

      const result = new Array(n);

      for (let i = 0; i !== n; ++i) result[i] = new THREE.Plane();

      return result;
    }

    function assignTransformedPlanes(planesOut, planesIn, matrix) {
      // sets an array of existing planes to transformed 'planesIn'

      for (let i = 0, n = planesIn.length; i !== n; ++i)
        planesOut[i].copy(planesIn[i]).applyMatrix4(matrix);
    }

    function cylindricalPlanes(n, innerRadius) {
      const result = createPlanes(n);

      for (let i = 0; i !== n; ++i) {
        const plane = result[i],
          angle = (i * Math.PI * 2) / n;

        plane.normal.set(Math.cos(angle), 0, Math.sin(angle));

        plane.constant = innerRadius;
      }

      return result;
    }

    const planeToMatrix = (function () {
      // creates a matrix that aligns X/Y to a given plane

      // temporaries:
      const xAxis = new THREE.Vector3(),
        yAxis = new THREE.Vector3(),
        trans = new THREE.Vector3();

      return function planeToMatrix(plane) {
        const zAxis = plane.normal,
          matrix = new THREE.Matrix4();

        // Hughes & Moeller '99
        // "Building an Orthonormal Basis from a Unit Vector."

        if (Math.abs(zAxis.x) > Math.abs(zAxis.z)) {
          yAxis.set(-zAxis.y, zAxis.x, 0);
        } else {
          yAxis.set(0, -zAxis.z, zAxis.y);
        }

        xAxis.crossVectors(yAxis.normalize(), zAxis);

        plane.coplanarPoint(trans);
        return matrix.set(
          xAxis.x,
          yAxis.x,
          zAxis.x,
          trans.x,
          xAxis.y,
          yAxis.y,
          zAxis.y,
          trans.y,
          xAxis.z,
          yAxis.z,
          zAxis.z,
          trans.z,
          0,
          0,
          0,
          1
        );
      };
    })();

    // A regular tetrahedron for the clipping volume:

    const Vertices = [
        new THREE.Vector3(+1, 0, +Math.SQRT1_2),
        new THREE.Vector3(-1, 0, +Math.SQRT1_2),
        new THREE.Vector3(0, +1, -Math.SQRT1_2),
        new THREE.Vector3(0, -1, -Math.SQRT1_2)
      ],
      Indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2],
      Planes = planesFromMesh(Vertices, Indices),
      PlaneMatrices = Planes.map(planeToMatrix),
      GlobalClippingPlanes = cylindricalPlanes(5, 2.5),
      Empty = Object.freeze([]);

    let camera,
      scene,
      renderer,
      startTime,
      stats,
      object,
      clipMaterial,
      volumeVisualization,
      globalClippingPlanes;

    function init() {
      camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.25, 16);

      camera.position.set(0, 1.5, 3);

      scene = new THREE.Scene();

      // Lights

      scene.add(new THREE.AmbientLight(0xffffff));

      const spotLight = new THREE.SpotLight(0xffffff, 60);
      spotLight.angle = Math.PI / 5;
      spotLight.penumbra = 0.2;
      spotLight.position.set(2, 3, 3);
      spotLight.castShadow = true;
      spotLight.shadow.camera.near = 3;
      spotLight.shadow.camera.far = 10;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      scene.add(spotLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(0, 2, 0);
      dirLight.castShadow = true;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 10;

      dirLight.shadow.camera.right = 1;
      dirLight.shadow.camera.left = -1;
      dirLight.shadow.camera.top = 1;
      dirLight.shadow.camera.bottom = -1;

      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      // Geometry

      clipMaterial = new THREE.MeshPhongMaterial({
        color: 0xee0a10,
        shininess: 100,
        side: THREE.DoubleSide,
        // Clipping setup:
        clippingPlanes: createPlanes(Planes.length),
        clipShadows: true
      });

      object = new THREE.Group();

      const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);

      for (let z = -2; z <= 2; ++z)
        for (let y = -2; y <= 2; ++y)
          for (let x = -2; x <= 2; ++x) {
            const mesh = new THREE.Mesh(geometry, clipMaterial);
            mesh.position.set(x / 5, y / 5, z / 5);
            mesh.castShadow = true;
            object.add(mesh);
          }

      scene.add(object);

      const planeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1),
        color = new THREE.Color();

      volumeVisualization = new THREE.Group();
      volumeVisualization.visible = false;

      for (let i = 0, n = Planes.length; i !== n; ++i) {
        const material = new THREE.MeshBasicMaterial({
          color: color.setHSL(i / n, 0.5, 0.5).getHex(),
          side: THREE.DoubleSide,

          opacity: 0.2,
          transparent: true,

          // clip to the others to show the volume (wildly
          // intersecting transparent planes look bad)
          clippingPlanes: clipMaterial.clippingPlanes.filter(function (_, j) {
            return j !== i;
          })

          // no need to enable shadow clipping - the plane
          // visualization does not cast shadows
        });

        const mesh = new THREE.Mesh(planeGeometry, material);
        mesh.matrixAutoUpdate = false;

        volumeVisualization.add(mesh);
      }

      scene.add(volumeVisualization);

      const ground = new THREE.Mesh(
        planeGeometry,
        new THREE.MeshPhongMaterial({
          color: 0xa0adaf,
          shininess: 10
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.scale.multiplyScalar(3);
      ground.receiveShadow = true;
      scene.add(ground);

      // Renderer

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      // Clipping setup:
      globalClippingPlanes = createPlanes(GlobalClippingPlanes.length);
      renderer.clippingPlanes = Empty;
      renderer.localClippingEnabled = true;

      window.addEventListener('resize', onWindowResize);

      // Stats

      stats = new Stats(renderer);

      // Controls

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 1;
      controls.maxDistance = 8;
      controls.target.set(0, 1, 0);
      controls.update();

      // GUI

      const gui = new GUI(),
        folder = gui.addFolder('Local Clipping'),
        props = {
          get Enabled() {
            return renderer.localClippingEnabled;
          },
          set Enabled(v) {
            renderer.localClippingEnabled = v;
            if (!v) volumeVisualization.visible = false;
          },

          get Shadows() {
            return clipMaterial.clipShadows;
          },
          set Shadows(v) {
            clipMaterial.clipShadows = v;
          },

          get Visualize() {
            return volumeVisualization.visible;
          },
          set Visualize(v) {
            if (renderer.localClippingEnabled) volumeVisualization.visible = v;
          }
        };

      folder.add(props, 'Enabled');
      folder.add(props, 'Shadows');
      folder.add(props, 'Visualize').listen();

      gui.addFolder('Global Clipping').add(
        {
          get Enabled() {
            return renderer.clippingPlanes !== Empty;
          },
          set Enabled(v) {
            renderer.clippingPlanes = v ? globalClippingPlanes : Empty;
          }
        },
        'Enabled'
      );

      // Start

      startTime = Date.now();
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function setObjectWorldMatrix(object, matrix) {
      // set the orientation of an object based on a world matrix

      const parent = object.parent;
      scene.updateMatrixWorld();
      object.matrix.copy(parent.matrixWorld).invert();
      object.applyMatrix4(matrix);
    }

    const transform = new THREE.Matrix4(),
      tmpMatrix = new THREE.Matrix4();

    function animate() {
      const currentTime = Date.now(),
        time = (currentTime - startTime) / 1000;

      object.position.y = 1;
      object.rotation.x = time * 0.5;
      object.rotation.y = time * 0.2;

      object.updateMatrix();
      transform.copy(object.matrix);

      const bouncy = Math.cos(time * 0.5) * 0.5 + 0.7;
      transform.multiply(tmpMatrix.makeScale(bouncy, bouncy, bouncy));

      assignTransformedPlanes(clipMaterial.clippingPlanes, Planes, transform);

      const planeMeshes = volumeVisualization.children;

      for (let i = 0, n = planeMeshes.length; i !== n; ++i) {
        tmpMatrix.multiplyMatrices(transform, PlaneMatrices[i]);
        setObjectWorldMatrix(planeMeshes[i], tmpMatrix);
      }

      transform.makeRotationY(time * 0.1);

      assignTransformedPlanes(globalClippingPlanes, GlobalClippingPlanes, transform);

      stats.begin();
      renderer.render(scene, camera);
      stats.end();
      stats.update();
    }

    init();
  }
};
export { exampleInfo as default };
