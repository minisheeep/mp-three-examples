import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_rgb_halftone',
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
        content: '- RGB Halftone post-processing by'
      },
      {
        tag: 'a',
        link: 'https://github.com/meatbags',
        content: 'Xavier Burrow'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, clock, camera, stats;

    const rotationSpeed = Math.PI / 64;

    let composer, group;

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);

      clock = new THREE.Clock();

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 12;

      stats = new Stats(renderer);

      // camera controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.update();

      // scene

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x444444);

      group = new THREE.Group();
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(100, 1, 100),
        new THREE.MeshPhongMaterial({})
      );
      floor.position.y = -10;
      const light = new THREE.PointLight(0xffffff, 250);
      light.position.y = 2;
      group.add(floor, light);
      scene.add(group);

      const mat = new THREE.ShaderMaterial({
        uniforms: {},

        vertexShader: [
          'varying vec2 vUV;',
          'varying vec3 vNormal;',

          'void main() {',

          'vUV = uv;',
          'vNormal = vec3( normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

          '}'
        ].join('\n'),

        fragmentShader: [
          'varying vec2 vUV;',
          'varying vec3 vNormal;',

          'void main() {',

          'vec4 c = vec4( abs( vNormal ) + vec3( vUV, 0.0 ), 0.0 );',
          'gl_FragColor = c;',

          '}'
        ].join('\n')
      });

      for (let i = 0; i < 50; ++i) {
        // fill scene with coloured cubes
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
        mesh.position.set(Math.random() * 16 - 8, Math.random() * 16 - 8, Math.random() * 16 - 8);
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        group.add(mesh);
      }

      // post-processing

      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      const params = {
        shape: 1,
        radius: 4,
        rotateR: Math.PI / 12,
        rotateB: (Math.PI / 12) * 2,
        rotateG: (Math.PI / 12) * 3,
        scatter: 0,
        blending: 1,
        blendingMode: 1,
        greyscale: false,
        disable: false
      };
      const halftonePass = new HalftonePass(window.innerWidth, window.innerHeight, params);
      composer.addPass(renderPass);
      composer.addPass(halftonePass);

      window.onresize = function () {
        // resize composer
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };

      // GUI

      const controller = {
        radius: halftonePass.uniforms['radius'].value,
        rotateR: halftonePass.uniforms['rotateR'].value / (Math.PI / 180),
        rotateG: halftonePass.uniforms['rotateG'].value / (Math.PI / 180),
        rotateB: halftonePass.uniforms['rotateB'].value / (Math.PI / 180),
        scatter: halftonePass.uniforms['scatter'].value,
        shape: halftonePass.uniforms['shape'].value,
        greyscale: halftonePass.uniforms['greyscale'].value,
        blending: halftonePass.uniforms['blending'].value,
        blendingMode: halftonePass.uniforms['blendingMode'].value,
        disable: halftonePass.uniforms['disable'].value
      };

      function onGUIChange() {
        // update uniforms
        halftonePass.uniforms['radius'].value = controller.radius;
        halftonePass.uniforms['rotateR'].value = controller.rotateR * (Math.PI / 180);
        halftonePass.uniforms['rotateG'].value = controller.rotateG * (Math.PI / 180);
        halftonePass.uniforms['rotateB'].value = controller.rotateB * (Math.PI / 180);
        halftonePass.uniforms['scatter'].value = controller.scatter;
        halftonePass.uniforms['shape'].value = controller.shape;
        halftonePass.uniforms['greyscale'].value = controller.greyscale;
        halftonePass.uniforms['blending'].value = controller.blending;
        halftonePass.uniforms['blendingMode'].value = controller.blendingMode;
        halftonePass.uniforms['disable'].value = controller.disable;
      }

      const gui = new GUI();
      gui
        .add(controller, 'shape', { Dot: 1, Ellipse: 2, Line: 3, Square: 4 })
        .onChange(onGUIChange);
      gui.add(controller, 'radius', 1, 25).onChange(onGUIChange);
      gui.add(controller, 'rotateR', 0, 90).onChange(onGUIChange);
      gui.add(controller, 'rotateG', 0, 90).onChange(onGUIChange);
      gui.add(controller, 'rotateB', 0, 90).onChange(onGUIChange);
      gui.add(controller, 'scatter', 0, 1, 0.01).onChange(onGUIChange);
      gui.add(controller, 'greyscale').onChange(onGUIChange);
      gui.add(controller, 'blending', 0, 1, 0.01).onChange(onGUIChange);
      gui
        .add(controller, 'blendingMode', { Linear: 1, Multiply: 2, Add: 3, Lighter: 4, Darker: 5 })
        .onChange(onGUIChange);
      gui.add(controller, 'disable').onChange(onGUIChange);

      needToDispose(renderer, controls, composer, scene);
    }

    function animate() {
      const delta = clock.getDelta();
      stats.update();
      group.rotation.y += delta * rotationSpeed;
      composer.render(delta);
    }
  }
};
export { exampleInfo as default };
