import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_procedural',
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
        content: '- Procedural Effects Example by'
      },
      {
        tag: 'a',
        link: 'https://clara.io',
        content: 'Ben Houston'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let postCamera, postScene, renderer;
    let postMaterial, noiseRandom1DMaterial, noiseRandom2DMaterial, noiseRandom3DMaterial, postQuad;
    let stats;

    const params = { procedure: 'noiseRandom3D' };

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      const proceduralVert = `varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}`;
      // Setup post processing stage
      postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      noiseRandom1DMaterial = new THREE.ShaderMaterial({
        vertexShader: proceduralVert,
        fragmentShader: `
			#include <common>
			varying vec2 vUv;
			void main() {
				gl_FragColor.xyz = vec3( rand( vUv ) );
				gl_FragColor.w = 1.0;
			}
		`
      });
      noiseRandom2DMaterial = new THREE.ShaderMaterial({
        vertexShader: proceduralVert,
        fragmentShader: `
			#include <common>
			varying vec2 vUv;
			void main() {
				vec2 rand2 = vec2( rand( vUv ), rand( vUv + vec2( 0.4, 0.6 ) ) );
				gl_FragColor.xyz = mix( mix( vec3( 1.0, 1.0, 1.0 ), vec3( 0.0, 0.0, 1.0 ), rand2.x ), vec3( 0.0 ), rand2.y );
				gl_FragColor.w = 1.0;
			}
		`
      });
      noiseRandom3DMaterial = new THREE.ShaderMaterial({
        vertexShader: proceduralVert,
        fragmentShader: `
			#include <common>
			varying vec2 vUv;
			void main() {
				vec3 rand3 = vec3( rand( vUv ), rand( vUv + vec2( 0.4, 0.6 ) ), rand( vUv + vec2( 0.6, 0.4 ) ) );
				gl_FragColor.xyz = rand3;
				gl_FragColor.w = 1.0;
			}
		`
      });
      postMaterial = noiseRandom3DMaterial;
      const postPlane = new THREE.PlaneGeometry(2, 2);
      postQuad = new THREE.Mesh(postPlane, postMaterial);
      postScene = new THREE.Scene();
      postScene.add(postQuad);

      window.addEventListener('resize', onWindowResize);

      //

      const gui = new GUI();
      gui.add(params, 'procedure', ['noiseRandom1D', 'noiseRandom2D', 'noiseRandom3D']);

      needToDispose(renderer, postScene);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      switch (params.procedure) {
        case 'noiseRandom1D':
          postMaterial = noiseRandom1DMaterial;
          break;
        case 'noiseRandom2D':
          postMaterial = noiseRandom2DMaterial;
          break;
        case 'noiseRandom3D':
          postMaterial = noiseRandom3DMaterial;
          break;
      }

      postQuad.material = postMaterial;

      // render post FX
      renderer.render(postScene, postCamera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
