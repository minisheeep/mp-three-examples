import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_lights_hemisphere',
  useLoaders: { GLTFLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl hemisphere light example' }
    ],
    [
      { tag: 'text', content: 'flamingo by' },
      { tag: 'a', link: 'https://mirada.com/', content: 'mirada' },
      { tag: 'text', content: 'from' },
      { tag: 'a', link: 'http://www.ro.me', content: 'ro.me' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    const mixers = [];
    let stats;

    const clock = new THREE.Clock();

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 5000);
      camera.position.set(0, 0, 250);

      scene = new THREE.Scene();
      scene.background = new THREE.Color().setHSL(0.6, 0, 1);
      scene.fog = new THREE.Fog(scene.background, 1, 5000);

      // LIGHTS

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
      hemiLight.color.setHSL(0.6, 1, 0.6);
      hemiLight.groundColor.setHSL(0.095, 1, 0.75);
      hemiLight.position.set(0, 50, 0);
      scene.add(hemiLight);

      const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
      scene.add(hemiLightHelper);

      //

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.color.setHSL(0.1, 1, 0.95);
      dirLight.position.set(-1, 1.75, 1);
      dirLight.position.multiplyScalar(30);
      scene.add(dirLight);

      dirLight.castShadow = true;

      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;

      const d = 50;

      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;

      dirLight.shadow.camera.far = 3500;
      dirLight.shadow.bias = -0.0001;

      const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
      scene.add(dirLightHelper);

      // GROUND

      const groundGeo = new THREE.PlaneGeometry(10000, 10000);
      const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      groundMat.color.setHSL(0.095, 1, 0.75);

      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.position.y = -33;
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // SKYDOME

      const vertexShader = `

			varying vec3 vWorldPosition;

			void main() {

				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}

		`;
      const fragmentShader = `

			uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;

			varying vec3 vWorldPosition;

			void main() {

				float h = normalize( vWorldPosition + offset ).y;
				gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

			}

		`;
      const uniforms = {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      };
      uniforms['topColor'].value.copy(hemiLight.color);

      scene.fog.color.copy(uniforms['bottomColor'].value);

      const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);

      // MODEL

      const loader = new GLTFLoader();

      loader.load('models/gltf/Flamingo.glb', function (gltf) {
        const mesh = gltf.scene.children[0];

        const s = 0.35;
        mesh.scale.set(s, s, s);
        mesh.position.y = 15;
        mesh.rotation.y = -1;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);

        const mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(gltf.animations[0]).setDuration(1).play();
        mixers.push(mixer);
      });

      // RENDERER

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = true;

      // STATS

      stats = new Stats(renderer);

      //

      const params = {
        toggleHemisphereLight: function () {
          hemiLight.visible = !hemiLight.visible;
          hemiLightHelper.visible = !hemiLightHelper.visible;
        },
        toggleDirectionalLight: function () {
          dirLight.visible = !dirLight.visible;
          dirLightHelper.visible = !dirLightHelper.visible;
        },
        shadowIntensity: 1
      };

      const gui = new GUI();

      gui.add(params, 'toggleHemisphereLight').name('toggle hemisphere light');
      gui.add(params, 'toggleDirectionalLight').name('toggle directional light');
      gui
        .add(params, 'shadowIntensity', 0, 1)
        .name('shadow intensity')
        .onChange((value) => {
          dirLight.shadow.intensity = value;
        });
      gui.open();

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
      render();
      stats.update();
    }

    function render() {
      const delta = clock.getDelta();

      for (let i = 0; i < mixers.length; i++) {
        mixers[i].update(delta);
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
