import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_interactive_lines',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - interactive lines'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let camera, scene, raycaster, renderer, parentTransform, sphereInter;

    const pointer = new THREE.Vector2();
    const radius = 100;
    let theta = 0;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      const geometry = new THREE.SphereGeometry(5);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      sphereInter = new THREE.Mesh(geometry, material);
      sphereInter.visible = false;
      scene.add(sphereInter);

      const lineGeometry = new THREE.BufferGeometry();
      const points = [];

      const point = new THREE.Vector3();
      const direction = new THREE.Vector3();

      for (let i = 0; i < 50; i++) {
        direction.x += Math.random() - 0.5;
        direction.y += Math.random() - 0.5;
        direction.z += Math.random() - 0.5;
        direction.normalize().multiplyScalar(10);

        point.add(direction);
        points.push(point.x, point.y, point.z);
      }

      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

      parentTransform = new THREE.Object3D();
      parentTransform.position.x = Math.random() * 40 - 20;
      parentTransform.position.y = Math.random() * 40 - 20;
      parentTransform.position.z = Math.random() * 40 - 20;

      parentTransform.rotation.x = Math.random() * 2 * Math.PI;
      parentTransform.rotation.y = Math.random() * 2 * Math.PI;
      parentTransform.rotation.z = Math.random() * 2 * Math.PI;

      parentTransform.scale.x = Math.random() + 0.5;
      parentTransform.scale.y = Math.random() + 0.5;
      parentTransform.scale.z = Math.random() + 0.5;

      for (let i = 0; i < 50; i++) {
        let object;

        const lineMaterial = new THREE.LineBasicMaterial({ color: Math.random() * 0xffffff });

        if (Math.random() > 0.5) {
          object = new THREE.Line(lineGeometry, lineMaterial);
        } else {
          object = new THREE.LineSegments(lineGeometry, lineMaterial);
        }

        object.position.x = Math.random() * 400 - 200;
        object.position.y = Math.random() * 400 - 200;
        object.position.z = Math.random() * 400 - 200;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() + 0.5;
        object.scale.y = Math.random() + 0.5;
        object.scale.z = Math.random() + 0.5;

        parentTransform.add(object);
      }

      scene.add(parentTransform);

      raycaster = new THREE.Raycaster();
      raycaster.params.Line.threshold = 3;

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      canvas.addEventListener('pointermove', onPointerMove);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onPointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    //

    function animate() {
      render();
      stats.update();
    }

    function render() {
      theta += 0.1;

      camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.y = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));
      camera.lookAt(scene.position);

      camera.updateMatrixWorld();

      // find intersections

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(parentTransform.children, true);

      if (intersects.length > 0) {
        sphereInter.visible = true;
        sphereInter.position.copy(intersects[0].point);
      } else {
        sphereInter.visible = false;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
