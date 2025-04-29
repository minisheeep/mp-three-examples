import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_md2_control',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- MD2 Loader' }
    ],
    [{ tag: 'text', content: 'use arrows to control characters, mouse for camera' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let SCREEN_WIDTH = window.innerWidth;
    let SCREEN_HEIGHT = window.innerHeight;

    let stats;
    let camera, scene, renderer;

    const characters = [];
    let nCharacters = 0;

    let cameraControls;

    const controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false
    };

    const clock = new THREE.Clock();

    init();

    function init() {
      // CAMERA

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
      camera.position.set(0, 150, 1300);

      // SCENE

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      scene.fog = new THREE.Fog(0xffffff, 1000, 4000);

      scene.add(camera);

      // LIGHTS

      scene.add(new THREE.AmbientLight(0x666666, 3));

      const light = new THREE.DirectionalLight(0xffffff, 7);
      light.position.set(200, 450, 500);

      light.castShadow = true;

      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 512;

      light.shadow.camera.near = 100;
      light.shadow.camera.far = 1200;

      light.shadow.camera.left = -1000;
      light.shadow.camera.right = 1000;
      light.shadow.camera.top = 350;
      light.shadow.camera.bottom = -350;

      scene.add(light);
      // scene.add( new THREE.CameraHelper( light.shadow.camera ) );

      //  GROUND

      const gt = new THREE.TextureLoader().load('textures/terrain/grasslight-big.jpg');
      const gg = new THREE.PlaneGeometry(16000, 16000);
      const gm = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gt });

      const ground = new THREE.Mesh(gg, gm);
      ground.rotation.x = -Math.PI / 2;
      ground.material.map.repeat.set(64, 64);
      ground.material.map.wrapS = THREE.RepeatWrapping;
      ground.material.map.wrapT = THREE.RepeatWrapping;
      ground.material.map.colorSpace = THREE.SRGBColorSpace;
      // note that because the ground does not cast a shadow, .castShadow is left false
      ground.receiveShadow = true;

      scene.add(ground);

      // RENDERER

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      renderer.setAnimationLoop(animate);
      //

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // STATS

      stats = new Stats(renderer);

      // EVENTS

      window.addEventListener('resize', onWindowResize);

      // CONTROLS

      cameraControls = new OrbitControls(camera, renderer.domElement);
      cameraControls.target.set(0, 50, 0);
      cameraControls.update();

      // CHARACTER

      const configOgro = {
        baseUrl: 'models/md2/ogro/',

        body: 'ogro.md2',
        skins: [
          'grok.jpg',
          'ogrobase.png',
          'arboshak.png',
          'ctf_r.png',
          'ctf_b.png',
          'darkam.png',
          'freedom.png',
          'gib.png',
          'gordogh.png',
          'igdosh.png',
          'khorne.png',
          'nabogro.png',
          'sharokh.png'
        ],
        weapons: [['weapon.md2', 'weapon.jpg']],
        animations: {
          move: 'run',
          idle: 'stand',
          jump: 'jump',
          attack: 'attack',
          crouchMove: 'cwalk',
          crouchIdle: 'cstand',
          crouchAttach: 'crattack'
        },

        walkSpeed: 350,
        crouchSpeed: 175
      };

      const nRows = 1;
      const nSkins = configOgro.skins.length;

      nCharacters = nSkins * nRows;

      for (let i = 0; i < nCharacters; i++) {
        const character = new MD2CharacterComplex();
        character.scale = 3;
        character.controls = controls;
        characters.push(character);
      }

      const baseCharacter = new MD2CharacterComplex();
      baseCharacter.scale = 3;

      baseCharacter.onLoadComplete = function () {
        let k = 0;

        for (let j = 0; j < nRows; j++) {
          for (let i = 0; i < nSkins; i++) {
            const cloneCharacter = characters[k];

            cloneCharacter.shareParts(baseCharacter);

            // cast and receive shadows
            cloneCharacter.enableShadows(true);

            cloneCharacter.setWeapon(0);
            cloneCharacter.setSkin(i);

            cloneCharacter.root.position.x = (i - nSkins / 2) * 150;
            cloneCharacter.root.position.z = j * 250;

            scene.add(cloneCharacter.root);

            k++;
          }
        }

        const gyro = new Gyroscope();
        gyro.add(camera);
        gyro.add(light, light.target);

        characters[Math.floor(nSkins / 2)].root.add(gyro);
      };

      baseCharacter.loadParts(configOgro);

      const gui = new GUI();
      gui.add(controls, 'moveForward');
      gui.add(controls, 'moveBackward');
      gui.add(controls, 'moveLeft');
      gui.add(controls, 'moveRight');

      needToDispose(renderer, scene, cameraControls);
    }

    // EVENT HANDLERS

    function onWindowResize() {
      SCREEN_WIDTH = window.innerWidth;
      SCREEN_HEIGHT = window.innerHeight;

      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

      camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      camera.updateProjectionMatrix();
    }

    function animate() {
      render();

      stats.update();
    }

    function render() {
      const delta = clock.getDelta();

      for (let i = 0; i < nCharacters; i++) {
        characters[i].update(delta);
      }

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
