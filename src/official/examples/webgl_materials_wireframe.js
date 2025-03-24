import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_wireframe',
  useLoaders: [],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - materials - wireframe'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const API = {
      thickness: 1
    };

    let renderer, scene, camera, mesh2;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 500);
      camera.position.z = 200;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render); // use if there is no animation loop
      controls.enablePan = false;
      controls.enableZoom = false;

      new THREE.BufferGeometryLoader().load(
        'models/json/WaltHeadLo_buffergeometry.json',
        function (geometry) {
          geometry.deleteAttribute('normal');
          geometry.deleteAttribute('uv');

          setupAttributes(geometry);

          // left

          const material1 = new THREE.MeshBasicMaterial({
            color: 0xe0e0ff,
            wireframe: true
          });

          const mesh1 = new THREE.Mesh(geometry, material1);
          mesh1.position.set(-40, 0, 0);

          scene.add(mesh1);

          // right

          const material2 = new THREE.ShaderMaterial({
            uniforms: { thickness: { value: API.thickness } },
            vertexShader: `

			attribute vec3 center;
			varying vec3 vCenter;

			void main() {

				vCenter = center;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}

		`,
            fragmentShader: `

			uniform float thickness;

			varying vec3 vCenter;

			void main() {

				vec3 afwidth = fwidth( vCenter.xyz );

				vec3 edge3 = smoothstep( ( thickness - 1.0 ) * afwidth, thickness * afwidth, vCenter.xyz );

				float edge = 1.0 - min( min( edge3.x, edge3.y ), edge3.z );

				gl_FragColor.rgb = gl_FrontFacing ? vec3( 0.9, 0.9, 1.0 ) : vec3( 0.4, 0.4, 0.5 );
				gl_FragColor.a = edge;

			}

		`,
            side: THREE.DoubleSide,
            alphaToCoverage: true // only works when WebGLRenderer's "antialias" is set to "true"
          });

          mesh2 = new THREE.Mesh(geometry, material2);
          mesh2.position.set(40, 0, 0);

          scene.add(mesh2);

          //

          render();
        }
      );

      //

      const gui = new GUI();

      gui.add(API, 'thickness', 0, 4).onChange(function () {
        mesh2.material.uniforms.thickness.value = API.thickness;
        render();
      });

      gui.open();

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function setupAttributes(geometry) {
      const vectors = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1)
      ];

      const position = geometry.attributes.position;
      const centers = new Float32Array(position.count * 3);

      for (let i = 0, l = position.count; i < l; i++) {
        vectors[i % 3].toArray(centers, i * 3);
      }

      geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3));
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
