import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_shader_lava',
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
        content: '- shader material demo. featuring lava shader by'
      },
      {
        tag: 'a',
        link: 'http://irrlicht.sourceforge.net/phpBB2/viewtopic.php?t=21057',
        content: 'TheGameMaker'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, renderer, composer, clock;

    let uniforms, mesh;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 3000);
      camera.position.z = 4;

      const scene = new THREE.Scene();

      clock = new THREE.Clock();

      const textureLoader = new THREE.TextureLoader();

      const cloudTexture = textureLoader.load('textures/lava/cloud.png');
      const lavaTexture = textureLoader.load('textures/lava/lavatile.jpg');

      lavaTexture.colorSpace = THREE.SRGBColorSpace;

      cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
      lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;

      uniforms = {
        fogDensity: { value: 0.45 },
        fogColor: { value: new THREE.Vector3(0, 0, 0) },
        time: { value: 1.0 },
        uvScale: { value: new THREE.Vector2(3.0, 1.0) },
        texture1: { value: cloudTexture },
        texture2: { value: lavaTexture }
      };

      const size = 0.65;

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `

			uniform vec2 uvScale;
			varying vec2 vUv;

			void main()
			{

				vUv = uvScale * uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;

			}

		`,
        fragmentShader: `

			uniform float time;

			uniform float fogDensity;
			uniform vec3 fogColor;

			uniform sampler2D texture1;
			uniform sampler2D texture2;

			varying vec2 vUv;

			void main( void ) {

				vec2 position = - 1.0 + 2.0 * vUv;

				vec4 noise = texture2D( texture1, vUv );
				vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
				vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;

				T1.x += noise.x * 2.0;
				T1.y += noise.y * 2.0;
				T2.x -= noise.y * 0.2;
				T2.y += noise.z * 0.2;

				float p = texture2D( texture1, T1 * 2.0 ).a;

				vec4 color = texture2D( texture2, T2 * 2.0 );
				vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

				if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
				if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
				if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

				gl_FragColor = temp;

				float depth = gl_FragCoord.z / gl_FragCoord.w;
				const float LOG2 = 1.442695;
				float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
				fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

				gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

			}

		`
      });

      mesh = new THREE.Mesh(new THREE.TorusGeometry(size, 0.3, 30, 30), material);
      mesh.rotation.x = 0.3;
      scene.add(mesh);

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;
      //

      const renderModel = new RenderPass(scene, camera);
      const effectBloom = new BloomPass(1.25);
      const outputPass = new OutputPass();

      composer = new EffectComposer(renderer);

      composer.addPass(renderModel);
      composer.addPass(effectBloom);
      composer.addPass(outputPass);

      //
      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, composer);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      const delta = 5 * clock.getDelta();

      uniforms['time'].value += 0.2 * delta;

      mesh.rotation.y += 0.0125 * delta;
      mesh.rotation.x += 0.05 * delta;

      renderer.clear();
      composer.render(0.01);
    }
  }
};
export { exampleInfo as default };
