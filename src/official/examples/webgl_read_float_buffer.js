import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_read_float_buffer',
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
        content: 'read linear-srgb float pixel data'
      }
    ],
    [
      {
        tag: 'text',
        content: '$valueNode$'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, bindInfoText }) => {
    let stats;

    let cameraRTT, sceneRTT, sceneScreen, renderer, zmesh1, zmesh2;

    let mouseX = 0,
      mouseY = 0;

    const valueNode = bindInfoText('$valueNode$');
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    let rtTexture, material, quad;

    let delta = 0.01;

    init();

    function init() {
      cameraRTT = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        -10000,
        10000
      );
      cameraRTT.position.z = 100;

      //

      sceneRTT = new THREE.Scene();
      sceneScreen = new THREE.Scene();

      let light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0, 0, 1).normalize();
      sceneRTT.add(light);

      light = new THREE.DirectionalLight(0xffd5d5, 4.5);
      light.position.set(0, 0, -1).normalize();
      sceneRTT.add(light);

      rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      });

      material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0.0 } },
        vertexShader: `

			varying vec2 vUv;

			void main() {

				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}

		`,
        fragmentShader: `

			varying vec2 vUv;
			uniform float time;

			void main() {

				float r = vUv.x;
				if( vUv.y < 0.5 ) r = 0.0;
				float g = vUv.y;
				if( vUv.x < 0.5 ) g = 0.0;

				gl_FragColor = vec4( r, g, time, 1.0 );

			}

		`
      });

      const materialScreen = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: rtTexture.texture } },
        vertexShader: `

			varying vec2 vUv;

			void main() {

				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}

		`,
        fragmentShader: `

			varying vec2 vUv;
			uniform sampler2D tDiffuse;

			void main() {

				gl_FragColor = texture2D( tDiffuse, vUv );
				#include <colorspace_fragment>

			}

		`,

        depthWrite: false
      });

      const plane = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);

      quad = new THREE.Mesh(plane, material);
      quad.position.z = -100;
      sceneRTT.add(quad);

      const geometry = new THREE.TorusGeometry(100, 25, 15, 30);

      const mat1 = new THREE.MeshPhongMaterial({
        color: 0x9c9c9c,
        specular: 0xffaa00,
        shininess: 5
      });
      const mat2 = new THREE.MeshPhongMaterial({
        color: 0x9c0000,
        specular: 0xff2200,
        shininess: 5
      });

      zmesh1 = new THREE.Mesh(geometry, mat1);
      zmesh1.position.set(0, 0, 100);
      zmesh1.scale.set(1.5, 1.5, 1.5);
      sceneRTT.add(zmesh1);

      zmesh2 = new THREE.Mesh(geometry, mat2);
      zmesh2.position.set(0, 150, 100);
      zmesh2.scale.set(0.75, 0.75, 0.75);
      sceneRTT.add(zmesh2);

      quad = new THREE.Mesh(plane, materialScreen);
      quad.position.z = -100;
      sceneScreen.add(quad);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;

      stats = new Stats(renderer);

      canvas.addEventListener('pointermove', onDocumentMouseMove);
      needToDispose(renderer, sceneRTT, sceneScreen);
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    //

    function animate() {
      render();
      stats.update();
    }

    function render() {
      const time = Date.now() * 0.0015;

      if (zmesh1 && zmesh2) {
        zmesh1.rotation.y = -time;
        zmesh2.rotation.y = -time + Math.PI / 2;
      }

      if (material.uniforms['time'].value > 1 || material.uniforms['time'].value < 0) {
        delta *= -1;
      }

      material.uniforms['time'].value += delta;

      renderer.clear();

      // Render first scene into texture

      renderer.setRenderTarget(rtTexture);
      renderer.clear();
      renderer.render(sceneRTT, cameraRTT);

      // Render full screen quad with generated texture

      renderer.setRenderTarget(null);
      renderer.render(sceneScreen, cameraRTT);

      const read = new Float32Array(4);
      renderer.readRenderTargetPixels(
        rtTexture,
        windowHalfX + mouseX,
        windowHalfY - mouseY,
        1,
        1,
        read
      );

      valueNode.value = 'r:' + read[0] + '<br/>g:' + read[1] + '<br/>b:' + read[2];
    }
  }
};
export { exampleInfo as default };
