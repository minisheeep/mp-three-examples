import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_normalmap',
  useLoaders: { GLTFLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '- webgl normalmap demo.' }
    ],
    [
      { tag: 'a', link: 'https://casual-effects.com/data/', content: 'Lee Perry-Smith' },
      { tag: 'text', content: 'head.' }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats, loader;

    let camera, scene, renderer;

    let mesh;

    let directionalLight, pointLight, ambientLight;

    let mouseX = 0;
    let mouseY = 0;

    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    let composer, effectFXAA;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 12;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x494949);

      // LIGHTS

      ambientLight = new THREE.AmbientLight(0xffffff);
      scene.add(ambientLight);

      pointLight = new THREE.PointLight(0xffffff, 30);
      pointLight.position.set(0, 0, 6);

      scene.add(pointLight);

      directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(1, -0.5, -1);
      scene.add(directionalLight);

      const textureLoader = new THREE.TextureLoader();

      const diffuseMap = textureLoader.load('models/gltf/LeePerrySmith/Map-COL.jpg');
      diffuseMap.colorSpace = THREE.SRGBColorSpace;

      const specularMap = textureLoader.load('models/gltf/LeePerrySmith/Map-SPEC.jpg');
      specularMap.colorSpace = THREE.SRGBColorSpace;

      const normalMap = textureLoader.load(
        'models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg'
      );

      const material = new THREE.MeshPhongMaterial({
        color: 0xefefef,
        specular: 0x222222,
        shininess: 35,
        map: diffuseMap,
        specularMap: specularMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8)
      });

      loader = new GLTFLoader();
      loader.load('models/gltf/LeePerrySmith/LeePerrySmith.glb', function (gltf) {
        const geometry = gltf.scene.children[0].geometry;

        mesh = new THREE.Mesh(geometry, material);

        mesh.position.y = -0.5;

        scene.add(mesh);
      });

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      stats = new Stats(renderer);

      // COMPOSER

      renderer.autoClear = false;

      const renderModel = new RenderPass(scene, camera);

      const effectBleach = new ShaderPass(BleachBypassShader);
      const effectColor = new ShaderPass(ColorCorrectionShader);
      const outputPass = new OutputPass();
      effectFXAA = new ShaderPass(FXAAShader);

      effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

      effectBleach.uniforms['opacity'].value = 0.2;

      effectColor.uniforms['powRGB'].value.set(1.4, 1.45, 1.45);
      effectColor.uniforms['mulRGB'].value.set(1.1, 1.1, 1.1);

      const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        type: THREE.HalfFloatType,
        depthTexture: new THREE.DepthTexture()
      });

      composer = new EffectComposer(renderer, renderTarget);

      composer.addPass(renderModel);
      composer.addPass(effectBleach);
      composer.addPass(effectColor);
      composer.addPass(outputPass);
      composer.addPass(effectFXAA);

      // EVENTS

      canvas.addEventListener('pointermove', onDocumentMouseMove);
      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
    }

    //

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);

      effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    //

    function animate() {
      render();

      stats.update();
    }

    function render() {
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      if (mesh) {
        mesh.rotation.y += 0.05 * (targetX - mesh.rotation.y);
        mesh.rotation.x += 0.05 * (targetY - mesh.rotation.x);
      }

      composer.render();
    }
  }
};
export { exampleInfo as default };
