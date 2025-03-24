import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_shader',
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
        content: '- shader demo. featuring'
      },
      {
        tag: 'a',
        link: 'http://www.pouet.net/prod.php?which=52761',
        content: 'Monjori by Mic'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;

    let uniforms;

    init();

    function init() {
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      scene = new THREE.Scene();

      const geometry = new THREE.PlaneGeometry(2, 2);

      uniforms = {
        time: { value: 1.0 }
      };

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
			varying vec2 vUv;
			void main()	{
				vUv = uv;
				gl_Position = vec4( position, 1.0 );
			}
		`,
        fragmentShader: `
			varying vec2 vUv;
			uniform float time;
			void main()	{
				vec2 p = - 1.0 + 2.0 * vUv;
				float a = time * 40.0;
				float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;
				e = 400.0 * ( p.x * 0.5 + 0.5 );
				f = 400.0 * ( p.y * 0.5 + 0.5 );
				i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
				d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
				r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
				q = f / r;
				e = ( r * cos( q ) ) - a / 2.0;
				f = ( r * sin( q ) ) - a / 2.0;
				d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
				h = ( ( f + d ) + a / 2.0 ) * g;
				i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
				h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
				h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
				i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
				i = mod( i / 5.6, 256.0 ) / 64.0;
				if ( i < 0.0 ) i += 4.0;
				if ( i >= 2.0 ) i = 4.0 - i;
				d = r / 350.0;
				d += sin( d * d * 8.0 ) * 0.52;
				f = ( sin( a * g ) + 1.0 ) / 2.0;
				gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
			}
		`
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    const startTime = Date.now();

    function animate() {
      uniforms['time'].value = (Date.now() - startTime) / 1000;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
