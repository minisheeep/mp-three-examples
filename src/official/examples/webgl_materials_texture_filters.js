import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_texture_filters',
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
        content: '- texture filtering example'
      }
    ]
  ],
  infoPanel: {
    left: [
      ['Floor', 'g_(128x128)'],
      ['mag:', 'Linear'],
      ['min:', 'LinearMipmapLinear'],
      ['Painting', 'g_(748x600)'],
      ['mag:', 'Linear'],
      ['min:', 'Linear']
    ],
    right: [
      ['Floor', 'g_'],
      ['mag:', 'Nearest'],
      ['min:', 'Nearest'],
      ['Painting', 'g_'],
      ['mag:', 'Nearest'],
      ['min:', 'Nearest']
    ]
  },
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;

    let camera, scene, scene2, renderer;

    let mouseX = 0,
      mouseY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 5000);
      camera.position.z = 1500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 1500, 4000);

      scene2 = new THREE.Scene();
      scene2.background = new THREE.Color(0x000000);
      scene2.fog = new THREE.Fog(0x000000, 1500, 4000);

      // GROUND

      const imageCanvas = document.createElement('canvas');
      const context = imageCanvas.getContext('2d');

      imageCanvas.width = imageCanvas.height = 128;

      context.fillStyle = '#444';
      context.fillRect(0, 0, 128, 128);

      context.fillStyle = '#fff';
      context.fillRect(0, 0, 64, 64);
      context.fillRect(64, 64, 64, 64);

      const textureCanvas = new THREE.CanvasTexture(imageCanvas);
      textureCanvas.colorSpace = THREE.SRGBColorSpace;
      textureCanvas.repeat.set(1000, 1000);
      textureCanvas.wrapS = THREE.RepeatWrapping;
      textureCanvas.wrapT = THREE.RepeatWrapping;

      const textureCanvas2 = textureCanvas.clone();
      textureCanvas2.magFilter = THREE.NearestFilter;
      textureCanvas2.minFilter = THREE.NearestFilter;

      const materialCanvas = new THREE.MeshBasicMaterial({ map: textureCanvas });
      const materialCanvas2 = new THREE.MeshBasicMaterial({ color: 0xffccaa, map: textureCanvas2 });

      const geometry = new THREE.PlaneGeometry(100, 100);

      const meshCanvas = new THREE.Mesh(geometry, materialCanvas);
      meshCanvas.rotation.x = -Math.PI / 2;
      meshCanvas.scale.set(1000, 1000, 1000);

      const meshCanvas2 = new THREE.Mesh(geometry, materialCanvas2);
      meshCanvas2.rotation.x = -Math.PI / 2;
      meshCanvas2.scale.set(1000, 1000, 1000);

      // PAINTING

      const callbackPainting = function () {
        const image = texturePainting.image;

        texturePainting2.image = image;
        texturePainting2.needsUpdate = true;

        scene.add(meshCanvas);
        scene2.add(meshCanvas2);

        const geometry = new THREE.PlaneGeometry(100, 100);
        const mesh = new THREE.Mesh(geometry, materialPainting);
        const mesh2 = new THREE.Mesh(geometry, materialPainting2);

        addPainting(scene, mesh);
        addPainting(scene2, mesh2);

        function addPainting(zscene, zmesh) {
          zmesh.scale.x = image.width / 100;
          zmesh.scale.y = image.height / 100;

          zscene.add(zmesh);

          const meshFrame = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: 0x000000 })
          );
          meshFrame.position.z = -10.0;
          meshFrame.scale.x = (1.1 * image.width) / 100;
          meshFrame.scale.y = (1.1 * image.height) / 100;
          zscene.add(meshFrame);

          const meshShadow = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.75, transparent: true })
          );
          meshShadow.position.y = (-1.1 * image.height) / 2;
          meshShadow.position.z = (-1.1 * image.height) / 2;
          meshShadow.rotation.x = -Math.PI / 2;
          meshShadow.scale.x = (1.1 * image.width) / 100;
          meshShadow.scale.y = (1.1 * image.height) / 100;
          zscene.add(meshShadow);

          const floorHeight = (-1.117 * image.height) / 2;
          meshCanvas.position.y = meshCanvas2.position.y = floorHeight;
        }
      };

      const texturePainting = new THREE.TextureLoader().load(
        'textures/758px-Canestra_di_frutta_(Caravaggio).jpg',
        callbackPainting
      );
      const texturePainting2 = new THREE.Texture();

      const materialPainting = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texturePainting
      });
      const materialPainting2 = new THREE.MeshBasicMaterial({
        color: 0xffccaa,
        map: texturePainting2
      });

      texturePainting.colorSpace = THREE.SRGBColorSpace;
      texturePainting2.colorSpace = THREE.SRGBColorSpace;
      texturePainting2.minFilter = texturePainting2.magFilter = THREE.NearestFilter;
      texturePainting.minFilter = texturePainting.magFilter = THREE.LinearFilter;
      texturePainting.mapping = THREE.UVMapping;

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false;

      canvas.addEventListener('pointermove', onDocumentMouseMove);
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    function animate() {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-(mouseY - 200) - camera.position.y) * 0.05;

      camera.lookAt(scene.position);

      renderer.clear();
      renderer.setScissorTest(true);

      renderer.setScissor(0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
      renderer.render(scene, camera);

      renderer.setScissor(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
      renderer.render(scene2, camera);

      renderer.setScissorTest(false);
    }
  }
};
export { exampleInfo as default };
