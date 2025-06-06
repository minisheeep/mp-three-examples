import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_layers',
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
        content: '- webgl layers'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let camera, scene, renderer;

    let theta = 0;
    const radius = 5;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.layers.enable(0); // enabled by default
      camera.layers.enable(1);
      camera.layers.enable(2);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      const light = new THREE.PointLight(0xffffff, 3, 0, 0);
      light.layers.enable(0);
      light.layers.enable(1);
      light.layers.enable(2);

      scene.add(camera);
      camera.add(light);

      const colors = [0xff0000, 0x00ff00, 0x0000ff];
      const geometry = new THREE.BoxGeometry();

      for (let i = 0; i < 300; i++) {
        const layer = i % 3;

        const object = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({ color: colors[layer] })
        );

        object.position.x = Math.random() * 40 - 20;
        object.position.y = Math.random() * 40 - 20;
        object.position.z = Math.random() * 40 - 20;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() + 0.5;
        object.scale.y = Math.random() + 0.5;
        object.scale.z = Math.random() + 0.5;

        object.layers.set(layer);

        scene.add(object);
      }

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      stats = new Stats(renderer);

      const layers = {
        'toggle red': function () {
          camera.layers.toggle(0);
        },

        'toggle green': function () {
          camera.layers.toggle(1);
        },

        'toggle blue': function () {
          camera.layers.toggle(2);
        },

        'enable all': function () {
          camera.layers.enableAll();
        },

        'disable all': function () {
          camera.layers.disableAll();
        }
      };

      //
      // Init gui
      const gui = new GUI();
      gui.add(layers, 'toggle red');
      gui.add(layers, 'toggle green');
      gui.add(layers, 'toggle blue');
      gui.add(layers, 'enable all');
      gui.add(layers, 'disable all');

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
      camera.position.y = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
