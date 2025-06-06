import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_lines_indexed',
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
        content: 'webgl - buffergeometry - lines - indexed'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    let parent_node;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 9000;

      scene = new THREE.Scene();

      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ vertexColors: true });

      const indices = [];
      const positions = [];
      const colors = [];

      let next_positions_index = 0;

      //

      const iteration_count = 4;
      const rangle = (60 * Math.PI) / 180.0;

      function add_vertex(v) {
        positions.push(v.x, v.y, v.z);
        colors.push(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);

        return next_positions_index++;
      }

      // simple Koch curve

      function snowflake_iteration(p0, p4, depth) {
        if (--depth < 0) {
          const i = next_positions_index - 1; // p0 already there
          add_vertex(p4);
          indices.push(i, i + 1);

          return;
        }

        const v = p4.clone().sub(p0);
        const v_tier = v.clone().multiplyScalar(1 / 3);
        const p1 = p0.clone().add(v_tier);

        const angle = Math.atan2(v.y, v.x) + rangle;
        const length = v_tier.length();
        const p2 = p1.clone();
        p2.x += Math.cos(angle) * length;
        p2.y += Math.sin(angle) * length;

        const p3 = p0.clone().add(v_tier).add(v_tier);

        snowflake_iteration(p0, p1, depth);
        snowflake_iteration(p1, p2, depth);
        snowflake_iteration(p2, p3, depth);
        snowflake_iteration(p3, p4, depth);
      }

      function snowflake(points, loop, x_offset) {
        for (let iteration = 0; iteration != iteration_count; iteration++) {
          add_vertex(points[0]);

          for (let p_index = 0, p_count = points.length - 1; p_index != p_count; p_index++) {
            snowflake_iteration(points[p_index], points[p_index + 1], iteration);
          }

          if (loop) snowflake_iteration(points[points.length - 1], points[0], iteration);

          // translate input curve for next iteration

          for (let p_index = 0, p_count = points.length; p_index != p_count; p_index++) {
            points[p_index].x += x_offset;
          }
        }
      }

      let y = 0;

      snowflake([new THREE.Vector3(0, y, 0), new THREE.Vector3(500, y, 0)], false, 600);

      y += 600;
      snowflake(
        [
          new THREE.Vector3(0, y, 0),
          new THREE.Vector3(250, y + 400, 0),
          new THREE.Vector3(500, y, 0)
        ],
        true,
        600
      );

      y += 600;
      snowflake(
        [
          new THREE.Vector3(0, y, 0),
          new THREE.Vector3(500, y, 0),
          new THREE.Vector3(500, y + 500, 0),
          new THREE.Vector3(0, y + 500, 0)
        ],
        true,
        600
      );

      y += 1000;
      snowflake(
        [
          new THREE.Vector3(250, y, 0),
          new THREE.Vector3(500, y, 0),
          new THREE.Vector3(250, y, 0),
          new THREE.Vector3(250, y + 250, 0),
          new THREE.Vector3(250, y, 0),
          new THREE.Vector3(0, y, 0),
          new THREE.Vector3(250, y, 0),
          new THREE.Vector3(250, y - 250, 0),
          new THREE.Vector3(250, y, 0)
        ],
        false,
        600
      );

      //

      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();

      const lineSegments = new THREE.LineSegments(geometry, material);
      lineSegments.position.x -= 1200;
      lineSegments.position.y -= 1200;

      parent_node = new THREE.Object3D();
      parent_node.add(lineSegments);

      scene.add(parent_node);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);

      //

      stats = new Stats(renderer);

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      const time = Date.now() * 0.001;

      parent_node.rotation.z = time * 0.5;

      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
