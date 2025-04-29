import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_morphtargets_horse',
  useLoaders: { GLTFLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: 'webgl - morph targets - horse'
      }
    ],
    [
      {
        tag: 'text',
        content: 'model by'
      },
      {
        tag: 'a',
        link: 'https://mirada.com/',
        content: 'mirada'
      },
      {
        tag: 'text',
        content: 'from'
      },
      {
        tag: 'a',
        link: 'http://www.ro.me',
        content: 'rome'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let camera, scene, renderer;
    let mesh, mixer;

    const radius = 600;
    let theta = 0;
    let prevTime = Date.now();

    init();

    function init() {
      //

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.y = 300;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      //

      const light1 = new THREE.DirectionalLight(0xefefff, 5);
      light1.position.set(1, 1, 1).normalize();
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffefef, 5);
      light2.position.set(-1, -1, -1).normalize();
      scene.add(light2);

      const loader = new GLTFLoader();
      loader.load('models/gltf/Horse.glb', function (gltf) {
        mesh = gltf.scene.children[0];
        mesh.scale.set(1.5, 1.5, 1.5);
        scene.add(mesh);

        mixer = new THREE.AnimationMixer(mesh);

        mixer.clipAction(gltf.animations[0]).setDuration(1).play();
      });

      //

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);

      //

      stats = new Stats(renderer);

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
      theta += 0.1;

      camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));

      camera.lookAt(0, 150, 0);

      if (mixer) {
        const time = Date.now();

        mixer.update((time - prevTime) * 0.001);

        prevTime = time;
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
