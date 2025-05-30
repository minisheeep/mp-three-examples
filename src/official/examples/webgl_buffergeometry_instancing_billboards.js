import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_instancing_billboards',
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
        content: '- instanced circle billboards - colors'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;
    let geometry, material, mesh;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
      camera.position.z = 1400;

      scene = new THREE.Scene();

      const circleGeometry = new THREE.CircleGeometry(1, 6);

      geometry = new THREE.InstancedBufferGeometry();
      geometry.index = circleGeometry.index;
      geometry.attributes = circleGeometry.attributes;

      const particleCount = 75000;

      const translateArray = new Float32Array(particleCount * 3);

      for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
        translateArray[i3 + 0] = Math.random() * 2 - 1;
        translateArray[i3 + 1] = Math.random() * 2 - 1;
        translateArray[i3 + 2] = Math.random() * 2 - 1;
      }

      geometry.setAttribute('translate', new THREE.InstancedBufferAttribute(translateArray, 3));

      material = new THREE.RawShaderMaterial({
        uniforms: {
          map: { value: new THREE.TextureLoader().load('textures/sprites/circle.png') },
          time: { value: 0.0 }
        },
        vertexShader: `
		precision highp float;
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
		uniform float time;
		attribute vec3 position;
		attribute vec2 uv;
		attribute vec3 translate;
		varying vec2 vUv;
		varying float vScale;
		void main() {
			vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );
			vec3 trTime = vec3(translate.x + time,translate.y + time,translate.z + time);
			float scale =  sin( trTime.x * 2.1 ) + sin( trTime.y * 3.2 ) + sin( trTime.z * 4.3 );
			vScale = scale;
			scale = scale * 10.0 + 10.0;
			mvPosition.xyz += position * scale;
			vUv = uv;
			gl_Position = projectionMatrix * mvPosition;
		}
	`,
        fragmentShader: `
		precision highp float;
		uniform sampler2D map;
		varying vec2 vUv;
		varying float vScale;
		// HSL to RGB Convertion helpers
		vec3 HUEtoRGB(float H){
			H = mod(H,1.0);
			float R = abs(H * 6.0 - 3.0) - 1.0;
			float G = 2.0 - abs(H * 6.0 - 2.0);
			float B = 2.0 - abs(H * 6.0 - 4.0);
			return clamp(vec3(R,G,B),0.0,1.0);
		}
		vec3 HSLtoRGB(vec3 HSL){
			vec3 RGB = HUEtoRGB(HSL.x);
			float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;
			return (RGB - 0.5) * C + HSL.z;
		}
		void main() {
			vec4 diffuseColor = texture2D( map, vUv );
			gl_FragColor = vec4( diffuseColor.xyz * HSLtoRGB(vec3(vScale/5.0, 1.0, 0.5)), diffuseColor.w );
			if ( diffuseColor.w < 0.5 ) discard;
		}
	`,
        depthTest: true,
        depthWrite: true
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(500, 500, 500);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const starTime = Date.now();
    function animate() {
      const time = (Date.now() - starTime) * 0.0005;

      material.uniforms['time'].value = time;

      mesh.rotation.x = time * 0.2;
      mesh.rotation.y = time * 0.4;
      renderer.render(scene, camera);

      stats.update();
    }
  }
};
export { exampleInfo as default };
