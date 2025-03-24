import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_test_memory2',
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
        content: '- memory test II'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const N = 100;

    let camera, scene, renderer;

    let geometry;

    const meshes = [];

    let fragmentShader, vertexShader;

    init();

    function init() {
      vertexShader = `
			void main() {
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
			}
		`;
      fragmentShader = `
			void main() {
				if ( mod ( gl_FragCoord.x, 4.0001 ) < 1.0 || mod ( gl_FragCoord.y, 4.0001 ) < 1.0 )
					gl_FragColor = vec4( XXX, 1.0 );
				else
					gl_FragColor = vec4( 1.0 );
			}
		`;

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 2000;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      geometry = new THREE.SphereGeometry(15, 64, 32);

      for (let i = 0; i < N; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: generateFragmentShader()
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = (0.5 - Math.random()) * 1000;
        mesh.position.y = (0.5 - Math.random()) * 1000;
        mesh.position.z = (0.5 - Math.random()) * 1000;

        scene.add(mesh);

        meshes.push(mesh);
      }

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(render);

      needToDispose(renderer, scene);
    }

    //

    function generateFragmentShader() {
      return fragmentShader.replace(
        'XXX',
        Math.random() + ',' + Math.random() + ',' + Math.random()
      );
    }

    function render() {
      for (let i = 0; i < N; i++) {
        const mesh = meshes[i];
        mesh.material = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: generateFragmentShader()
        });
      }

      renderer.render(scene, camera);

      console.log('before', renderer.info.programs.length);

      for (let i = 0; i < N; i++) {
        const mesh = meshes[i];
        mesh.material.dispose();
      }

      console.log('after', renderer.info.programs.length);
    }
  }
};
export { exampleInfo as default };
