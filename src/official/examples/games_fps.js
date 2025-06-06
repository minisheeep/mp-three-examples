import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

const exampleInfo = {
  name: 'games_fps',
  useLoaders: { GLTFLoader },
  needArrowControls: true,
  info: [
    [
      {
        tag: 'text',
        content: 'Octree threejs demo - basic collisions with static triangle mesh'
      }
    ],
    [
      {
        tag: 'text',
        content: 'MOUSE to look around and to throw balls'
      }
    ],
    [
      {
        tag: 'text',
        content: 'WASD to move and SPACE to jump'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const clock = new THREE.Clock();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88ccee);
    scene.fog = new THREE.Fog(0x88ccee, 0, 50);

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.rotation.order = 'YXZ';

    const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
    fillLight1.position.set(2, 1, 1);
    scene.add(fillLight1);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(-5, 25, -1);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.radius = 4;
    directionalLight.shadow.bias = -0.00006;
    scene.add(directionalLight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const stats = new Stats(renderer);

    const GRAVITY = 30;

    const NUM_SPHERES = 100;
    const SPHERE_RADIUS = 0.2;

    const STEPS_PER_FRAME = 5;

    const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

    const spheres = [];
    let sphereIdx = 0;

    for (let i = 0; i < NUM_SPHERES; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.castShadow = true;
      sphere.receiveShadow = true;

      scene.add(sphere);

      spheres.push({
        mesh: sphere,
        collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
        velocity: new THREE.Vector3()
      });
    }

    const worldOctree = new Octree();

    const playerCollider = new Capsule(
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 1, 0),
      0.35
    );

    const playerVelocity = new THREE.Vector3();
    const playerDirection = new THREE.Vector3();

    let playerOnFloor = false;
    const mouseTime = 0;

    const keyStates = {};

    const vector1 = new THREE.Vector3();
    const vector2 = new THREE.Vector3();
    const vector3 = new THREE.Vector3();

    window.addEventListener('keydown', (event) => {
      keyStates[event.code] = true;
    });

    window.addEventListener('keyup', (event) => {
      keyStates[event.code] = false;
    });

    //
    // document.addEventListener('mouseup', () => {
    //   if (document.pointerLockElement !== null) throwBall();
    // });

    let prevX = 0,
      prevY = 0;

    canvas.addEventListener('pointerdown', (event) => {
      prevX = event.clientX;
      prevY = event.clientY;
    });
    canvas.addEventListener('pointermove', (event) => {
      const offsetX = event.clientX - prevX;
      const offsetY = event.clientY - prevY;
      camera.rotation.y -= offsetX / 500;
      camera.rotation.x -= offsetY / 500;
      prevX = event.clientX;
      prevY = event.clientY;
    });

    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function throwBall() {
      const sphere = spheres[sphereIdx];

      camera.getWorldDirection(playerDirection);

      sphere.collider.center
        .copy(playerCollider.end)
        .addScaledVector(playerDirection, playerCollider.radius * 1.5);

      // throw the ball with more force if we hold the button longer, and if we move forward

      // const impulse = 15 + 30 * (1 - Math.exp((mouseTime - Date.now()) * 0.001));
      const impulse = 20;

      sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
      sphere.velocity.addScaledVector(playerVelocity, 2);

      sphereIdx = (sphereIdx + 1) % spheres.length;
    }

    function playerCollisions() {
      const result = worldOctree.capsuleIntersect(playerCollider);

      playerOnFloor = false;

      if (result) {
        playerOnFloor = result.normal.y > 0;

        if (!playerOnFloor) {
          playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
        }

        if (result.depth >= 1e-10) {
          playerCollider.translate(result.normal.multiplyScalar(result.depth));
        }
      }
    }

    function updatePlayer(deltaTime) {
      let damping = Math.exp(-4 * deltaTime) - 1;

      if (!playerOnFloor) {
        playerVelocity.y -= GRAVITY * deltaTime;

        // small air resistance
        damping *= 0.1;
      }

      playerVelocity.addScaledVector(playerVelocity, damping);

      const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
      playerCollider.translate(deltaPosition);

      playerCollisions();

      camera.position.copy(playerCollider.end);
    }

    function playerSphereCollision(sphere) {
      const center = vector1
        .addVectors(playerCollider.start, playerCollider.end)
        .multiplyScalar(0.5);

      const sphere_center = sphere.collider.center;

      const r = playerCollider.radius + sphere.collider.radius;
      const r2 = r * r;

      // approximation: player = 3 spheres

      for (const point of [playerCollider.start, playerCollider.end, center]) {
        const d2 = point.distanceToSquared(sphere_center);

        if (d2 < r2) {
          const normal = vector1.subVectors(point, sphere_center).normalize();
          const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
          const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

          playerVelocity.add(v2).sub(v1);
          sphere.velocity.add(v1).sub(v2);

          const d = (r - Math.sqrt(d2)) / 2;
          sphere_center.addScaledVector(normal, -d);
        }
      }
    }

    function spheresCollisions() {
      for (let i = 0, length = spheres.length; i < length; i++) {
        const s1 = spheres[i];

        for (let j = i + 1; j < length; j++) {
          const s2 = spheres[j];

          const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
          const r = s1.collider.radius + s2.collider.radius;
          const r2 = r * r;

          if (d2 < r2) {
            const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
            const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
            const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

            s1.velocity.add(v2).sub(v1);
            s2.velocity.add(v1).sub(v2);

            const d = (r - Math.sqrt(d2)) / 2;

            s1.collider.center.addScaledVector(normal, d);
            s2.collider.center.addScaledVector(normal, -d);
          }
        }
      }
    }

    function updateSpheres(deltaTime) {
      spheres.forEach((sphere) => {
        sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

        const result = worldOctree.sphereIntersect(sphere.collider);

        if (result) {
          sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
          sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
          sphere.velocity.y -= GRAVITY * deltaTime;
        }

        const damping = Math.exp(-1.5 * deltaTime) - 1;
        sphere.velocity.addScaledVector(sphere.velocity, damping);

        playerSphereCollision(sphere);
      });

      spheresCollisions();

      for (const sphere of spheres) {
        sphere.mesh.position.copy(sphere.collider.center);
      }
    }

    function getForwardVector() {
      camera.getWorldDirection(playerDirection);
      playerDirection.y = 0;
      playerDirection.normalize();

      return playerDirection;
    }

    function getSideVector() {
      camera.getWorldDirection(playerDirection);
      playerDirection.y = 0;
      playerDirection.normalize();
      playerDirection.cross(camera.up);

      return playerDirection;
    }

    function controls(deltaTime) {
      // gives a bit of air control
      const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

      if (keyStates['ArrowUp'] || keyStates['KeyW']) {
        playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
      }

      if (keyStates['ArrowDown'] || keyStates['KeyS']) {
        playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
      }

      if (keyStates['ArrowLeft'] || keyStates['KeyA']) {
        playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
      }

      if (keyStates['ArrowRight'] || keyStates['KeyD']) {
        playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
      }

      if (playerOnFloor) {
        if (keyStates['Space']) {
          playerVelocity.y = 15;
        }
      }
    }

    const loader = new GLTFLoader().setPath('./models/gltf/');

    loader.load('collision-world.glb', (gltf) => {
      scene.add(gltf.scene);

      worldOctree.fromGraphNode(gltf.scene);

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material.map) {
            child.material.map.anisotropy = 4;
          }
        }
      });

      const helper = new OctreeHelper(worldOctree);
      helper.visible = false;
      scene.add(helper);

      const gui = new GUI({ width: 200 });
      gui.add({ debug: false }, 'debug').onChange(function (value) {
        helper.visible = value;
      });
      gui.add({ throwBall }, 'throwBall');
      gui.add(
        {
          jump() {
            keyStates['Space'] = true;
            setTimeout(() => {
              keyStates['Space'] = false;
            }, 200);
          }
        },
        'jump'
      );

      needToDispose(renderer, scene);
    });

    function teleportPlayerIfOob() {
      if (camera.position.y <= -25) {
        playerCollider.start.set(0, 0.35, 0);
        playerCollider.end.set(0, 1, 0);
        playerCollider.radius = 0.35;
        camera.position.copy(playerCollider.end);
        camera.rotation.set(0, 0, 0);
      }
    }

    function animate() {
      const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

      // we look for collisions in substeps to mitigate the risk of
      // an object traversing another too quickly for detection.

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        controls(deltaTime);

        updatePlayer(deltaTime);

        updateSpheres(deltaTime);

        teleportPlayerIfOob();
      }

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
