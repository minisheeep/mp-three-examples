import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webaudio_visualizer',
  useLoaders: [],
  initAfterConfirm: {
    text: ['注意音量']
  },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webaudio - visualizer'
      }
    ],
    [
      {
        tag: 'text',
        content: 'music by'
      },
      {
        tag: 'a',
        link: 'http://www.newgrounds.com/audio/listen/376737',
        content: 'skullbeatz'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let scene, camera, renderer, analyser, uniforms;

    init();

    function init() {
      const fftSize = 128;

      scene = new THREE.Scene();

      camera = new THREE.Camera();

      //

      const listener = new THREE.AudioListener();

      const audio = new THREE.Audio(listener);
      const file = './sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3';

      const loader = new THREE.AudioLoader();
      loader.load(file, function (buffer) {
        audio.setBuffer(buffer);
        audio.duration = buffer.duration;
        audio.play();
      });

      analyser = new THREE.AudioAnalyser(audio, fftSize);

      //

      uniforms = {
        tAudioData: { value: new THREE.DataTexture(analyser.data, fftSize / 2, 1, THREE.RedFormat) }
      };

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = vec4( position, 1.0 );
			}`,
        fragmentShader: `
			uniform sampler2D tAudioData;
			varying vec2 vUv;
			void main() {
				vec3 backgroundColor = vec3( 0.125, 0.125, 0.125 );
				vec3 color = vec3( 1.0, 1.0, 0.0 );
				float f = texture2D( tAudioData, vec2( vUv.x, 0.0 ) ).r;
				float i = step( vUv.y, f ) * step( f - 0.0125, vUv.y );
				gl_FragColor = vec4( mix( backgroundColor, color, i ), 1.0 );
			}
		`
      });

      const geometry = new THREE.PlaneGeometry(1, 1);

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, {
        dispose: () => {
          audio.disconnect();
        }
      });
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      analyser.getFrequencyData();

      uniforms.tAudioData.value.needsUpdate = true;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
