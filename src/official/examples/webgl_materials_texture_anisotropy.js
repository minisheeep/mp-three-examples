import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_texture_anisotropy',
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
        content: '- anisotropic texture filtering example'
      }
    ],
    [
      {
        tag: 'text',
        content: 'left anisotropy: $textLeft$ | right anisotropy: $textRight$'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, bindInfoText }) => {
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;
    const textLeft = bindInfoText('$textLeft$');
    const textRight = bindInfoText('$textRight$');

    let stats;

    let camera, scene1, scene2, renderer;

    let mouseX = 0,
      mouseY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

      //

      camera = new THREE.PerspectiveCamera(35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000);
      camera.position.z = 1500;

      scene1 = new THREE.Scene();
      scene1.background = new THREE.Color(0xf2f7ff);
      scene1.fog = new THREE.Fog(0xf2f7ff, 1, 25000);

      scene2 = new THREE.Scene();
      scene2.background = new THREE.Color(0xf2f7ff);
      scene2.fog = new THREE.Fog(0xf2f7ff, 1, 25000);

      scene1.add(new THREE.AmbientLight(0xeef0ff, 3));
      scene2.add(new THREE.AmbientLight(0xeef0ff, 3));

      const light1 = new THREE.DirectionalLight(0xffffff, 6);
      light1.position.set(1, 1, 1);
      scene1.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 6);
      light2.position.set(1, 1, 1);
      scene2.add(light2);

      // GROUND

      const textureLoader = new THREE.TextureLoader();

      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

      const texture1 = textureLoader.load('textures/crate.gif');
      const material1 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture1 });

      texture1.colorSpace = THREE.SRGBColorSpace;
      texture1.anisotropy = maxAnisotropy;
      texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
      texture1.repeat.set(512, 512);

      const texture2 = textureLoader.load('textures/crate.gif');
      const material2 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture2 });

      texture2.colorSpace = THREE.SRGBColorSpace;
      texture2.anisotropy = 1;
      texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
      texture2.repeat.set(512, 512);

      if (maxAnisotropy > 0) {
        textLeft.value = texture1.anisotropy;
        textRight.value = texture2.anisotropy;
      } else {
        textLeft.value = 'not supported';
        textRight.value = 'not supported';
      }

      //

      const geometry = new THREE.PlaneGeometry(100, 100);

      const mesh1 = new THREE.Mesh(geometry, material1);
      mesh1.rotation.x = -Math.PI / 2;
      mesh1.scale.set(1000, 1000, 1000);

      const mesh2 = new THREE.Mesh(geometry, material2);
      mesh2.rotation.x = -Math.PI / 2;
      mesh2.scale.set(1000, 1000, 1000);

      scene1.add(mesh1);
      scene2.add(mesh2);

      // RENDERER

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;

      renderer.domElement.style.position = 'relative';
      // STATS1

      stats = new Stats(renderer);

      canvas.addEventListener('pointermove', onDocumentMouseMove);

      needToDispose(renderer, scene1, scene2);
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y = THREE.MathUtils.clamp(
        camera.position.y + (-(mouseY - 200) - camera.position.y) * 0.05,
        50,
        1000
      );

      camera.lookAt(scene1.position);

      renderer.clear();
      renderer.setScissorTest(true);

      renderer.setScissor(0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
      renderer.render(scene1, camera);

      renderer.setScissor(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
      renderer.render(scene2, camera);

      renderer.setScissorTest(false);
    }
  }
};
export { exampleInfo as default };
