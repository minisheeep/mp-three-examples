import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
import { Ammo } from 'three/examples/jsm/libs/ammo.wasm.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_mmd_audio',
  useLoaders: [MMDLoader],
  initAfterConfirm: {
    text: ['注意音量']
  },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- MMDLoader test'
      }
    ],
    [
      {
        tag: 'a',
        link: 'https://github.com/mrdoob/three.js/tree/master/examples/models/mmd#readme',
        content: 'MMD Assets license'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Copyright'
      },
      {
        tag: 'a',
        link: 'https://sites.google.com/view/evpvp/',
        content: 'Model Data'
      },
      {
        tag: 'a',
        link: 'http://www.nicovideo.jp/watch/sm13147122',
        content: 'Dance Data'
      },
      {
        tag: 'a',
        link: 'http://www.nicovideo.jp/watch/sm11938255',
        content: 'Audio Data'
      }
    ],
    [
      {
        tag: 'text',
        content: 'Camera is customized from'
      },
      {
        tag: 'a',
        link: 'http://www.nicovideo.jp/watch/sm19168559',
        content: 'this Data'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let mesh, camera, scene, renderer, effect, stats;
    let helper;

    let ready = false;

    const clock = new THREE.Clock();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);

      // scene

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      scene.add(new THREE.PolarGridHelper(30, 0));

      const listener = new THREE.AudioListener();
      camera.add(listener);
      scene.add(camera);

      const ambient = new THREE.AmbientLight(0xaaaaaa, 3);
      scene.add(ambient);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(-1, 1, 1).normalize();
      scene.add(directionalLight);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // renderer.setAnimationLoop(animate);
      useFrame(animate);
      effect = new OutlineEffect(renderer);

      // model

      function onProgress(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
      }

      const modelFile = 'models/mmd/miku/miku_v2.pmd';
      const vmdFiles = ['models/mmd/vmds/wavefile_v2.vmd'];
      const cameraFiles = ['models/mmd/vmds/wavefile_camera.vmd'];
      const audioFile = 'models/mmd/audios/wavefile_short.mp3';
      const audioParams = { delayTime: (150 * 1) / 30 };

      helper = new MMDAnimationHelper();

      const loader = new MMDLoader();

      loader.loadWithAnimation(
        modelFile,
        vmdFiles,
        function (mmd) {
          mesh = mmd.mesh;

          helper.add(mesh, {
            animation: mmd.animation,
            physics: true
          });

          loader.loadAnimation(
            cameraFiles,
            camera,
            function (cameraAnimation) {
              helper.add(camera, {
                animation: cameraAnimation
              });

              new THREE.AudioLoader().load(
                audioFile,
                function (buffer) {
                  const audio = new THREE.Audio(listener);
                  audio.setBuffer(buffer);
                  audio.duration = buffer.duration;
                  helper.add(audio, audioParams);
                  scene.add(mesh);

                  ready = true;

                  needToDispose({
                    dispose() {
                      console.log('dispose mmd');
                      helper.remove(mesh);
                      helper.remove(camera);
                      helper.remove(audio);
                      audio.stop();
                      audio.disconnect();
                    }
                  });
                },
                onProgress,
                null
              );
            },
            onProgress,
            null
          );
        },
        onProgress,
        null
      );

      //

      stats = new Stats(renderer);
      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, loader, helper);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      if (ready) {
        helper.update(clock.getDelta());
      }

      effect.render(scene, camera);
      stats.update();
    }

    Ammo().then(function (AmmoLib) {
      globalThis['Ammo'] = AmmoLib;
      init();
      needToDispose({
        dispose: () => {
          globalThis['Ammo'] = null;
        }
      });
    });
  }
};
export { exampleInfo as default };
