import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_sprites',
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
        content: '- sprites'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer;
    let cameraOrtho, sceneOrtho;

    let spriteTL, spriteTR, spriteBL, spriteBR, spriteC;

    let mapC;

    let group;

    init();

    function init() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera = new THREE.PerspectiveCamera(60, width / height, 1, 2100);
      camera.position.z = 1500;

      cameraOrtho = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        1,
        10
      );
      cameraOrtho.position.z = 10;

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 1500, 2100);

      sceneOrtho = new THREE.Scene();

      // create sprites

      const amount = 200;
      const radius = 500;

      const textureLoader = new THREE.TextureLoader();

      textureLoader.load('textures/sprite0.png', createHUDSprites);
      const mapB = textureLoader.load('textures/sprite1.png');
      mapC = textureLoader.load('textures/sprite2.png');

      mapB.colorSpace = THREE.SRGBColorSpace;
      mapC.colorSpace = THREE.SRGBColorSpace;

      group = new THREE.Group();

      const materialC = new THREE.SpriteMaterial({ map: mapC, color: 0xffffff, fog: true });
      const materialB = new THREE.SpriteMaterial({ map: mapB, color: 0xffffff, fog: true });

      for (let a = 0; a < amount; a++) {
        const x = Math.random() - 0.5;
        const y = Math.random() - 0.5;
        const z = Math.random() - 0.5;

        let material;

        if (z < 0) {
          material = materialB.clone();
        } else {
          material = materialC.clone();
          material.color.setHSL(0.5 * Math.random(), 0.75, 0.5);
          material.map.offset.set(-0.5, -0.5);
          material.map.repeat.set(2, 2);
        }

        const sprite = new THREE.Sprite(material);

        sprite.position.set(x, y, z);
        sprite.position.normalize();
        sprite.position.multiplyScalar(radius);

        group.add(sprite);
      }

      scene.add(group);

      // renderer

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.autoClear = false; // To allow render overlay on top of sprited sphere

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    function createHUDSprites(texture) {
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.SpriteMaterial({ map: texture });

      const width = material.map.image.width;
      const height = material.map.image.height;

      spriteTL = new THREE.Sprite(material);
      spriteTL.center.set(0.0, 1.0);
      spriteTL.scale.set(width, height, 1);
      sceneOrtho.add(spriteTL);

      spriteTR = new THREE.Sprite(material);
      spriteTR.center.set(1.0, 1.0);
      spriteTR.scale.set(width, height, 1);
      sceneOrtho.add(spriteTR);

      spriteBL = new THREE.Sprite(material);
      spriteBL.center.set(0.0, 0.0);
      spriteBL.scale.set(width, height, 1);
      sceneOrtho.add(spriteBL);

      spriteBR = new THREE.Sprite(material);
      spriteBR.center.set(1.0, 0.0);
      spriteBR.scale.set(width, height, 1);
      sceneOrtho.add(spriteBR);

      spriteC = new THREE.Sprite(material);
      spriteC.center.set(0.5, 0.5);
      spriteC.scale.set(width, height, 1);
      sceneOrtho.add(spriteC);

      updateHUDSprites();
    }

    function updateHUDSprites() {
      const width = window.innerWidth / 2;
      const height = window.innerHeight / 2;

      spriteTL.position.set(-width, height, 1); // top left
      spriteTR.position.set(width, height, 1); // top right
      spriteBL.position.set(-width, -height, 1); // bottom left
      spriteBR.position.set(width, -height, 1); // bottom right
      spriteC.position.set(0, 0, 1); // center
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      cameraOrtho.left = -width / 2;
      cameraOrtho.right = width / 2;
      cameraOrtho.top = height / 2;
      cameraOrtho.bottom = -height / 2;
      cameraOrtho.updateProjectionMatrix();

      updateHUDSprites();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const time = Date.now() / 1000;

      for (let i = 0, l = group.children.length; i < l; i++) {
        const sprite = group.children[i];
        const material = sprite.material;
        const scale = Math.sin(time + sprite.position.x * 0.01) * 0.3 + 1.0;

        let imageWidth = 1;
        let imageHeight = 1;

        if (material.map && material.map.image && material.map.image.width) {
          imageWidth = material.map.image.width;
          imageHeight = material.map.image.height;
        }

        sprite.material.rotation += 0.1 * (i / l);
        sprite.scale.set(scale * imageWidth, scale * imageHeight, 1.0);

        if (material.map !== mapC) {
          material.opacity = Math.sin(time + sprite.position.x * 0.01) * 0.4 + 0.6;
        }
      }

      group.rotation.x = time * 0.5;
      group.rotation.y = time * 0.75;
      group.rotation.z = time * 1.0;

      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(sceneOrtho, cameraOrtho);
    }
  }
};
export { exampleInfo as default };
