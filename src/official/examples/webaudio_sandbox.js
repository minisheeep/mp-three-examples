import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webaudio_sandbox',
  needArrowControls: true,
  initAfterConfirm: {
    text: ['注意音量']
  },
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
        content: 'webaudio - sandbox'
      }
    ],
    [
      {
        tag: 'text',
        content: 'music by'
      },
      {
        tag: 'a',
        link: 'http://www.newgrounds.com/audio/listen/358232',
        content: 'larrylarrybb'
      },
      {
        tag: 'text',
        content: ','
      },
      {
        tag: 'a',
        link: 'http://www.newgrounds.com/audio/listen/376737',
        content: 'skullbeatz'
      },
      {
        tag: 'text',
        content: 'and'
      },
      {
        tag: 'a',
        link: 'http://opengameart.org/content/project-utopia-seamless-loop',
        content: 'congusbongus'
      }
    ],
    [
      {
        tag: 'text',
        content: 'navigate with WASD / arrows / mouse'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, controls, scene, renderer, light;

    let material1, material2, material3;

    let analyser1, analyser2, analyser3;

    const clock = new THREE.Clock();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.set(0, 25, 0);

      const listener = new THREE.AudioListener();
      camera.add(listener);

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.0025);

      light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0, 0.5, 1).normalize();
      scene.add(light);

      const sphere = new THREE.SphereGeometry(20, 32, 16);

      material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });
      material2 = new THREE.MeshPhongMaterial({ color: 0xff2200, flatShading: true, shininess: 0 });
      material3 = new THREE.MeshPhongMaterial({ color: 0x6622aa, flatShading: true, shininess: 0 });

      // sound spheres

      const mesh1 = new THREE.Mesh(sphere, material1);
      mesh1.position.set(-250, 30, 0);
      scene.add(mesh1);

      const sound1 = new THREE.PositionalAudio(listener);
      sound1.setRefDistance(20);
      const loader = new THREE.AudioLoader();
      loader.load('sounds/358232_j_s_song.mp3', function (buffer) {
        sound1.setBuffer(buffer);
        sound1.duration = buffer.duration;
        sound1.play();
      });
      mesh1.add(sound1);

      //

      const mesh2 = new THREE.Mesh(sphere, material2);
      mesh2.position.set(250, 30, 0);
      scene.add(mesh2);

      const sound2 = new THREE.PositionalAudio(listener);
      sound2.setRefDistance(20);
      loader.load('sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3', function (buffer) {
        sound2.setBuffer(buffer);
        sound2.duration = buffer.duration;
        sound2.play();
      });
      mesh2.add(sound2);

      //

      const mesh3 = new THREE.Mesh(sphere, material3);
      mesh3.position.set(0, 30, -250);
      scene.add(mesh3);

      const sound3 = new THREE.PositionalAudio(listener);
      const oscillator = listener.context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(144, sound3.context.currentTime);
      oscillator.start(0);
      sound3.setNodeSource(oscillator);
      sound3.setRefDistance(20);
      sound3.setVolume(0.5);
      mesh3.add(sound3);

      // analysers

      analyser1 = new THREE.AudioAnalyser(sound1, 32);
      analyser2 = new THREE.AudioAnalyser(sound2, 32);
      analyser3 = new THREE.AudioAnalyser(sound3, 32);

      // global ambient audio

      const sound4 = new THREE.Audio(listener);
      sound4.setVolume(0.5);
      loader.load('sounds/Project_Utopia.mp3', function (buffer) {
        sound4.setBuffer(buffer);
        sound4.duration = buffer.duration;
        sound4.play();
      });

      // ground

      const helper = new THREE.GridHelper(1000, 10, 0x444444, 0x444444);
      helper.position.y = 0.1;
      scene.add(helper);

      //

      const SoundControls = function () {
        this.master = listener.getMasterVolume();
        this.firstSphere = sound1.getVolume();
        this.secondSphere = sound2.getVolume();
        this.thirdSphere = sound3.getVolume();
        this.Ambient = sound4.getVolume();
      };

      const GeneratorControls = function () {
        this.frequency = oscillator.frequency.value;
        this.wavetype = oscillator.type.toLowerCase();
      };

      const gui = new GUI();
      const soundControls = new SoundControls();
      const generatorControls = new GeneratorControls();
      const volumeFolder = gui.addFolder('sound volume');
      const generatorFolder = gui.addFolder('sound generator');

      volumeFolder
        .add(soundControls, 'master')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(function () {
          listener.setMasterVolume(soundControls.master);
        });
      volumeFolder
        .add(soundControls, 'firstSphere')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(function () {
          sound1.setVolume(soundControls.firstSphere);
        });
      volumeFolder
        .add(soundControls, 'secondSphere')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(function () {
          sound2.setVolume(soundControls.secondSphere);
        });

      volumeFolder
        .add(soundControls, 'thirdSphere')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(function () {
          sound3.setVolume(soundControls.thirdSphere);
        });
      volumeFolder
        .add(soundControls, 'Ambient')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(function () {
          sound4.setVolume(soundControls.Ambient);
        });
      volumeFolder.open();
      generatorFolder
        .add(generatorControls, 'frequency')
        .min(50.0)
        .max(5000.0)
        .step(1.0)
        .onChange(function () {
          oscillator.frequency.setValueAtTime(
            generatorControls.frequency,
            listener.context.currentTime
          );
        });
      generatorFolder
        .add(generatorControls, 'wavetype', ['sine', 'square', 'sawtooth', 'triangle'])
        .onChange(function () {
          oscillator.type = generatorControls.wavetype;
        });

      generatorFolder.open();

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      controls = new FirstPersonControls(camera, renderer.domElement);

      controls.movementSpeed = 70;
      controls.lookSpeed = 0.05;
      controls.lookVertical = false;

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, {
        dispose: () => {
          sound1.disconnect();
          sound2.disconnect();
          sound3.disconnect();
          sound4.disconnect();
        }
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      controls.handleResize();
    }

    function animate() {
      const delta = clock.getDelta();

      controls.update(delta);

      material1.emissive.b = analyser1.getAverageFrequency() / 256;
      material2.emissive.b = analyser2.getAverageFrequency() / 256;
      material3.emissive.b = analyser3.getAverageFrequency() / 256;

      renderer.render(scene, camera);
    }

    init();
  }
};
export { exampleInfo as default };
