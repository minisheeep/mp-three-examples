import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_buffergeometry_attributes_none',
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
        content: 'WebGL 2 - buffergeometry - attributes - none'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, mesh;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
      camera.position.z = 4;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505);
      scene.fog = new THREE.Fog(0x050505, 2000, 3500);

      // geometry

      const triangleCount = 10000;
      const vertexCountPerTriangle = 3;
      const vertexCount = triangleCount * vertexCountPerTriangle;

      const geometry = new THREE.BufferGeometry();
      geometry.setDrawRange(0, vertexCount);

      // material

      const material = new THREE.RawShaderMaterial({
        uniforms: {
          seed: { value: 42 }
        },
        vertexShader: `
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform float seed;
			const uint ieeeMantissa = 0x007FFFFFu;
			const uint ieeeOne = 0x3F800000u;
			uint hash(uint x) {
				x += ( x << 10u );
				x ^= ( x >>  6u );
				x += ( x <<  3u );
				x ^= ( x >> 11u );
				x += ( x << 15u );
				return x;
			}
			uint hash(uvec2 v) { return hash( v.x ^ hash(v.y) ); }
			float hashNoise(vec2 xy) {
				uint m = hash(floatBitsToUint(xy));
				m &= ieeeMantissa;
				m |= ieeeOne;
				return uintBitsToFloat( m ) - 1.0;
			}
			float pseudoRandom(float lower, float delta, in vec2 xy) {
				return lower + delta*hashNoise(xy);
			}
			vec3 pseudoRandomVec3(float lower, float upper, int index) {
				float delta = upper - lower;
				float x = pseudoRandom(lower, delta, vec2(index, 0));
				float y = pseudoRandom(lower, delta, vec2(index, 1));
				float z = pseudoRandom(lower, delta, vec2(index, 2));
				return vec3(x, y, z);
			}
			out vec3 vColor;
			void main()	{
				const float scale = 1.0/64.0;
				vec3 position = pseudoRandomVec3(-1.0, +1.0, gl_VertexID/3) + scale * pseudoRandomVec3(-1.0, +1.0, gl_VertexID);
				vec3 color = pseudoRandomVec3(0.25, 1.0, gl_VertexID/3);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
				vColor = color;
			}
		`,
        fragmentShader: `
			precision mediump float;
			in vec3 vColor;
			out vec4 fColor;
			void main()	{
				fColor = vec4(vColor, 1);
			}
		`,
        side: THREE.DoubleSide,
        glslVersion: THREE.GLSL3
      });

      // mesh

      mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);

      // renderer

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      needToDispose(renderer, scene);
    }

    function animate(time) {
      mesh.rotation.x = (time / 1000.0) * 0.25;
      mesh.rotation.y = (time / 1000.0) * 0.5;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
