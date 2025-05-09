import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import AmmoLib from 'three/examples/jsm/libs/ammo.wasm.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'physics_ammo_volume',
  useLoaders: {},
  info: [
    [
      {
        tag: 'text',
        content: 'Ammo.js physics soft body volume demo'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Click to throw a ball'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    // Graphics variables
    let stats;
    let camera, controls, scene, renderer;
    let textureLoader;
    const clock = new THREE.Clock();
    let clickRequest = false;
    const mouseCoords = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    // Physics variables
    const gravityConstant = -9.8;
    let physicsWorld;
    const rigidBodies = [];
    const softBodies = [];
    const margin = 0.05;
    let transformAux1;
    let softBodyHelpers;
    let Ammo;

    AmmoLib.call(
      {},
      {
        // 仅 web 环境需要这个，小程序会自动配置 wasm 地址
        locateFile(path) {
          return `https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/${path}`;
        }
      }
    ).then(function (AmmoLib) {
      Ammo = AmmoLib;
      init();
    });

    function init() {
      initGraphics();

      initPhysics();

      createObjects();

      initInput();
    }

    function initGraphics() {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbfd1e5);

      camera.position.set(-7, 5, 8);

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 2, 0);
      controls.update();

      textureLoader = new THREE.TextureLoader();

      const ambientLight = new THREE.AmbientLight(0xbbbbbb);
      scene.add(ambientLight);

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(-10, 10, 5);
      light.castShadow = true;
      const d = 20;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;

      light.shadow.camera.near = 2;
      light.shadow.camera.far = 50;

      light.shadow.mapSize.x = 1024;
      light.shadow.mapSize.y = 1024;

      scene.add(light);

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls);
    }

    function initPhysics() {
      // Physics configuration

      const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
      const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      const broadphase = new Ammo.btDbvtBroadphase();
      const solver = new Ammo.btSequentialImpulseConstraintSolver();
      const softBodySolver = new Ammo.btDefaultSoftBodySolver();
      physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfiguration,
        softBodySolver
      );
      physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
      physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

      transformAux1 = new Ammo.btTransform();
      softBodyHelpers = new Ammo.btSoftBodyHelpers();
    }

    function createObjects() {
      // Ground
      pos.set(0, -0.5, 0);
      quat.set(0, 0, 0, 1);
      const ground = createParalellepiped(
        40,
        1,
        40,
        0,
        pos,
        quat,
        new THREE.MeshPhongMaterial({ color: 0xffffff })
      );
      ground.castShadow = true;
      ground.receiveShadow = true;
      textureLoader.load('textures/grid.png', function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(40, 40);
        ground.material.map = texture;
        ground.material.needsUpdate = true;
      });

      // Create soft volumes
      const volumeMass = 15;

      const sphereGeometry = new THREE.SphereGeometry(1.5, 40, 25);
      sphereGeometry.translate(5, 5, 0);
      createSoftVolume(sphereGeometry, volumeMass, 250);

      const boxGeometry = new THREE.BoxGeometry(1, 1, 5, 4, 4, 20);
      boxGeometry.translate(-2, 5, 0);
      createSoftVolume(boxGeometry, volumeMass, 120);

      // Ramp
      pos.set(3, 1, 0);
      quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (30 * Math.PI) / 180);
      const obstacle = createParalellepiped(
        10,
        1,
        4,
        0,
        pos,
        quat,
        new THREE.MeshPhongMaterial({ color: 0x606060 })
      );
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
    }

    function processGeometry(bufGeometry) {
      // Ony consider the position values when merging the vertices
      const posOnlyBufGeometry = new THREE.BufferGeometry();
      posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'));
      posOnlyBufGeometry.setIndex(bufGeometry.getIndex());

      // Merge the vertices so the triangle soup is converted to indexed triangles
      const indexedBufferGeom = BufferGeometryUtils.mergeVertices(posOnlyBufGeometry);

      // Create index arrays mapping the indexed vertices to bufGeometry vertices
      mapIndices(bufGeometry, indexedBufferGeom);
    }

    function isEqual(x1, y1, z1, x2, y2, z2) {
      const delta = 0.000001;
      return Math.abs(x2 - x1) < delta && Math.abs(y2 - y1) < delta && Math.abs(z2 - z1) < delta;
    }

    function mapIndices(bufGeometry, indexedBufferGeom) {
      // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

      const vertices = bufGeometry.attributes.position.array;
      const idxVertices = indexedBufferGeom.attributes.position.array;
      const indices = indexedBufferGeom.index.array;

      const numIdxVertices = idxVertices.length / 3;
      const numVertices = vertices.length / 3;

      bufGeometry.ammoVertices = idxVertices;
      bufGeometry.ammoIndices = indices;
      bufGeometry.ammoIndexAssociation = [];

      for (let i = 0; i < numIdxVertices; i++) {
        const association = [];
        bufGeometry.ammoIndexAssociation.push(association);

        const i3 = i * 3;

        for (let j = 0; j < numVertices; j++) {
          const j3 = j * 3;
          if (
            isEqual(
              idxVertices[i3],
              idxVertices[i3 + 1],
              idxVertices[i3 + 2],
              vertices[j3],
              vertices[j3 + 1],
              vertices[j3 + 2]
            )
          ) {
            association.push(j3);
          }
        }
      }
    }

    function createSoftVolume(bufferGeom, mass, pressure) {
      processGeometry(bufferGeom);

      const volume = new THREE.Mesh(bufferGeom, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      volume.castShadow = true;
      volume.receiveShadow = true;
      volume.frustumCulled = false;
      scene.add(volume);

      textureLoader.load('textures/colors.png', function (texture) {
        volume.material.map = texture;
        volume.material.needsUpdate = true;
      });

      // Volume physic object

      const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
        physicsWorld.getWorldInfo(),
        bufferGeom.ammoVertices,
        bufferGeom.ammoIndices,
        bufferGeom.ammoIndices.length / 3,
        true
      );

      const sbConfig = volumeSoftBody.get_m_cfg();
      sbConfig.set_viterations(40);
      sbConfig.set_piterations(40);

      // Soft-soft and soft-rigid collisions
      sbConfig.set_collisions(0x11);

      // Friction
      sbConfig.set_kDF(0.1);
      // Damping
      sbConfig.set_kDP(0.01);
      // Pressure
      sbConfig.set_kPR(pressure);
      // Stiffness
      volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
      volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9);

      volumeSoftBody.setTotalMass(mass, false);
      Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin);
      physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
      volume.userData.physicsBody = volumeSoftBody;
      // Disable deactivation
      volumeSoftBody.setActivationState(4);

      softBodies.push(volume);
    }

    function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
      const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
      const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
      shape.setMargin(margin);

      createRigidBody(threeObject, shape, mass, pos, quat);

      return threeObject;
    }

    function createRigidBody(threeObject, physicsShape, mass, pos, quat) {
      threeObject.position.copy(pos);
      threeObject.quaternion.copy(quat);

      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      const motionState = new Ammo.btDefaultMotionState(transform);

      const localInertia = new Ammo.btVector3(0, 0, 0);
      physicsShape.calculateLocalInertia(mass, localInertia);

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        physicsShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      threeObject.userData.physicsBody = body;

      scene.add(threeObject);

      if (mass > 0) {
        rigidBodies.push(threeObject);

        // Disable deactivation
        body.setActivationState(4);
      }

      physicsWorld.addRigidBody(body);

      return body;
    }

    function initInput() {
      canvas.addEventListener('pointerdown', function (event) {
        if (!clickRequest) {
          mouseCoords.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
          );

          clickRequest = true;
        }
      });
    }

    function processClick() {
      if (clickRequest) {
        raycaster.setFromCamera(mouseCoords, camera);

        // Creates a ball
        const ballMass = 3;
        const ballRadius = 0.4;

        const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 18, 16), ballMaterial);
        ball.castShadow = true;
        ball.receiveShadow = true;
        const ballShape = new Ammo.btSphereShape(ballRadius);
        ballShape.setMargin(margin);
        pos.copy(raycaster.ray.direction);
        pos.add(raycaster.ray.origin);
        quat.set(0, 0, 0, 1);
        const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);
        ballBody.setFriction(0.5);

        pos.copy(raycaster.ray.direction);
        pos.multiplyScalar(14);
        ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));

        clickRequest = false;
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      const deltaTime = clock.getDelta();

      updatePhysics(deltaTime);

      processClick();

      renderer.render(scene, camera);
    }

    function updatePhysics(deltaTime) {
      // Step world
      physicsWorld.stepSimulation(deltaTime, 10);

      // Update soft volumes
      for (let i = 0, il = softBodies.length; i < il; i++) {
        const volume = softBodies[i];
        const geometry = volume.geometry;
        const softBody = volume.userData.physicsBody;
        const volumePositions = geometry.attributes.position.array;
        const volumeNormals = geometry.attributes.normal.array;
        const association = geometry.ammoIndexAssociation;
        const numVerts = association.length;
        const nodes = softBody.get_m_nodes();
        for (let j = 0; j < numVerts; j++) {
          const node = nodes.at(j);
          const nodePos = node.get_m_x();
          const x = nodePos.x();
          const y = nodePos.y();
          const z = nodePos.z();
          const nodeNormal = node.get_m_n();
          const nx = nodeNormal.x();
          const ny = nodeNormal.y();
          const nz = nodeNormal.z();

          const assocVertex = association[j];

          for (let k = 0, kl = assocVertex.length; k < kl; k++) {
            let indexVertex = assocVertex[k];
            volumePositions[indexVertex] = x;
            volumeNormals[indexVertex] = nx;
            indexVertex++;
            volumePositions[indexVertex] = y;
            volumeNormals[indexVertex] = ny;
            indexVertex++;
            volumePositions[indexVertex] = z;
            volumeNormals[indexVertex] = nz;
          }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
      }

      // Update rigid bodies
      for (let i = 0, il = rigidBodies.length; i < il; i++) {
        const objThree = rigidBodies[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if (ms) {
          ms.getWorldTransform(transformAux1);
          const p = transformAux1.getOrigin();
          const q = transformAux1.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }
    }
  }
};
export { exampleInfo as default };
