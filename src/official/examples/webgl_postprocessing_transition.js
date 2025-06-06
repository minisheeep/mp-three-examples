import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderTransitionPass } from 'three/examples/jsm/postprocessing/RenderTransitionPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_transition',
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
        content: 'webgl scene transitions'
      },
      {
        tag: 'text',
        content: 'by'
      },
      {
        tag: 'a',
        link: 'https://twitter.com/fernandojsg',
        content: 'fernandojsg'
      },
      {
        tag: 'text',
        content: '-'
      },
      {
        tag: 'a',
        link: 'https://github.com/kile/three.js-demos',
        content: 'github'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;
    let renderer, composer, renderTransitionPass;

    const textures = [];
    const clock = new THREE.Clock();

    const params = {
      sceneAnimate: true,
      transitionAnimate: true,
      transition: 0,
      useTexture: true,
      texture: 5,
      cycle: true,
      threshold: 0.1
    };

    const fxSceneA = new FXScene(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.Vector3(0, -0.4, 0),
      0xffffff
    );
    const fxSceneB = new FXScene(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.Vector3(0, 0.2, 0.1),
      0x000000
    );

    init();

    function init() {
      initGUI();
      initTextures();

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      composer = new EffectComposer(renderer);

      stats = new Stats(renderer);

      renderTransitionPass = new RenderTransitionPass(
        fxSceneA.scene,
        fxSceneA.camera,
        fxSceneB.scene,
        fxSceneB.camera
      );
      renderTransitionPass.setTexture(textures[0]);
      composer.addPass(renderTransitionPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      needToDispose(renderer, fxSceneA.scene, fxSceneB.scene, composer);
    }

    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
      fxSceneA.resize();
      fxSceneB.resize();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    new TWEEN.Tween(params)
      .to({ transition: 1 }, 1500)
      .onUpdate(function () {
        renderTransitionPass.setTransition(params.transition);

        // Change the current alpha texture after each transition
        if (params.cycle) {
          if (params.transition == 0 || params.transition == 1) {
            params.texture = (params.texture + 1) % textures.length;
            renderTransitionPass.setTexture(textures[params.texture]);
          }
        }
      })
      .repeat(Infinity)
      .delay(2000)
      .yoyo(true)
      .start();

    function animate() {
      // Transition animation
      if (params.transitionAnimate) TWEEN.update();

      const delta = clock.getDelta();
      fxSceneA.update(delta);
      fxSceneB.update(delta);

      render();
      stats.update();
    }

    function initTextures() {
      const loader = new THREE.TextureLoader();

      for (let i = 0; i < 6; i++) {
        textures[i] = loader.load('textures/transition/transition' + (i + 1) + '.png');
      }
    }

    function initGUI() {
      const gui = new GUI();

      gui.add(params, 'sceneAnimate').name('Animate scene');
      gui.add(params, 'transitionAnimate').name('Animate transition');
      gui
        .add(params, 'transition', 0, 1, 0.01)
        .onChange(function (value) {
          renderTransitionPass.setTransition(value);
        })
        .listen();

      gui.add(params, 'useTexture').onChange(function (value) {
        renderTransitionPass.useTexture(value);
      });

      gui
        .add(params, 'texture', {
          Perlin: 0,
          Squares: 1,
          Cells: 2,
          Distort: 3,
          Gradient: 4,
          Radial: 5
        })
        .onChange(function (value) {
          renderTransitionPass.setTexture(textures[value]);
        })
        .listen();

      gui.add(params, 'cycle');

      gui.add(params, 'threshold', 0, 1, 0.01).onChange(function (value) {
        renderTransitionPass.setTextureThreshold(value);
      });
    }

    function render() {
      // Prevent render both scenes when it's not necessary
      if (params.transition === 0) {
        renderer.render(fxSceneB.scene, fxSceneB.camera);
      } else if (params.transition === 1) {
        renderer.render(fxSceneA.scene, fxSceneA.camera);
      } else {
        // When 0 < transition < 1 render transition between two scenes
        composer.render();
      }
    }

    function FXScene(geometry, rotationSpeed, backgroundColor) {
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.z = 20;

      // Setup scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      scene.add(new THREE.AmbientLight(0xaaaaaa, 3));

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0, 1, 4);
      scene.add(light);

      this.rotationSpeed = rotationSpeed;

      const color = geometry.type === 'BoxGeometry' ? 0x0000ff : 0xff0000;
      const material = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
      const mesh = generateInstancedMesh(geometry, material, 500);
      scene.add(mesh);

      this.scene = scene;
      this.camera = camera;
      this.mesh = mesh;

      this.update = function (delta) {
        if (params.sceneAnimate) {
          mesh.rotation.x += this.rotationSpeed.x * delta;
          mesh.rotation.y += this.rotationSpeed.y * delta;
          mesh.rotation.z += this.rotationSpeed.z * delta;
        }
      };

      this.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };
    }

    function generateInstancedMesh(geometry, material, count) {
      const mesh = new THREE.InstancedMesh(geometry, material, count);

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      for (let i = 0; i < count; i++) {
        dummy.position.x = Math.random() * 100 - 50;
        dummy.position.y = Math.random() * 60 - 30;
        dummy.position.z = Math.random() * 80 - 40;

        dummy.rotation.x = Math.random() * 2 * Math.PI;
        dummy.rotation.y = Math.random() * 2 * Math.PI;
        dummy.rotation.z = Math.random() * 2 * Math.PI;

        dummy.scale.x = Math.random() * 2 + 1;

        if (geometry.type === 'BoxGeometry') {
          dummy.scale.y = Math.random() * 2 + 1;
          dummy.scale.z = Math.random() * 2 + 1;
        } else {
          dummy.scale.y = dummy.scale.x;
          dummy.scale.z = dummy.scale.x;
        }

        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color.setScalar(0.1 + 0.9 * Math.random()));
      }

      return mesh;
    }
  }
};
export { exampleInfo as default };
