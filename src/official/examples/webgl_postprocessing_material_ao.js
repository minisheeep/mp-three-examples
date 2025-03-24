import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { MeshPostProcessingMaterial } from 'three/examples/jsm/materials/MeshPostProcessingMaterial.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_postprocessing_material_ao',
  useLoaders: [RGBELoader, PLYLoader],
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Mesh Post Processing Material by'
      },
      {
        tag: 'a',
        link: 'https://github.com/Rabbid76',
        content: 'Rabbid76'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, camera, scene, composer, controls, stats;
    const sceneParameters = {
      output: 0,
      envMapIntensity: 1.0,
      ambientLightIntensity: 0.0,
      lightIntensity: 50,
      shadow: true
    };
    const aoParameters = {
      radius: 0.5,
      distanceExponent: 2,
      thickness: 10,
      scale: 1,
      samples: 16,
      distanceFallOff: 1
    };

    init();

    function init() {
      stats = new Stats(renderer);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = sceneParameters.shadow;

      const plyLoader = new PLYLoader();
      const rgbeloader = new RGBELoader();

      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 50);
      camera.position.set(0, 3, 5);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 1, 0);
      controls.update();
      controls.enablePan = false;
      controls.enableDamping = true;

      const width = window.innerWidth;
      const height = window.innerHeight;

      scene = new THREE.Scene();
      composer = new EffectComposer(renderer);

      const gtaoPass = new GTAOPass(scene, camera, width, height);
      gtaoPass.output = GTAOPass.OUTPUT.Off;
      const renderPasse = new RenderPass(scene, camera);
      const outputPass = new OutputPass();

      composer.addPass(gtaoPass);
      composer.addPass(renderPasse);
      composer.addPass(outputPass);

      rgbeloader.load('textures/equirectangular/royal_esplanade_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
      });

      const groundMaterial = new MeshPostProcessingMaterial({
        color: 0x7f7f7f,
        envMapIntensity: sceneParameters.envMapIntensity,
        aoPassMap: gtaoPass.gtaoMap
      });
      const objectMaterial = new MeshPostProcessingMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.5,
        envMapIntensity: sceneParameters.envMapIntensity,
        aoPassMap: gtaoPass.gtaoMap
      });
      const emissiveMaterial = new MeshPostProcessingMaterial({
        color: 0,
        emissive: 0xffffff,
        aoPassMap: gtaoPass.gtaoMap
      });
      plyLoader.load('models/ply/binary/Lucy100k.ply', (geometry) => {
        geometry.computeVertexNormals();
        const lucy = new THREE.Mesh(geometry, objectMaterial);
        lucy.receiveShadow = true;
        lucy.castShadow = true;
        lucy.scale.setScalar(0.001);
        lucy.rotation.set(0, Math.PI, 0);
        lucy.position.set(0.04, 1.8, 0.02);
        scene.add(lucy);
      });
      const ambientLight = new THREE.AmbientLight(0xffffff, sceneParameters.ambientLightIntensity);
      const lightGroup = new THREE.Group();
      const planeGeometry = new THREE.PlaneGeometry(6, 6);
      const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 64);
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const lightSphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      scene.background = new THREE.Color(0xbfe3dd);
      scene.add(ambientLight);
      scene.add(lightGroup);
      const targetObject = new THREE.Object3D();
      targetObject.position.set(0, 1, 0);
      scene.add(targetObject);
      const lightColors = [0xff4040, 0x40ff40, 0x4040ff];
      for (let j = 0; j < 3; ++j) {
        const light = new THREE.SpotLight(
          lightColors[j],
          sceneParameters.lightIntensity,
          0,
          Math.PI / 9
        );
        light.castShadow = true;
        light.shadow.camera.far = 15;
        light.position.set(
          5 * Math.cos((Math.PI * j * 2) / 3),
          2.5,
          5 * Math.sin((Math.PI * j * 2) / 3)
        );
        light.target = targetObject;
        lightGroup.add(light);
      }

      const groundPlane = new THREE.Mesh(planeGeometry, groundMaterial);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.position.set(0, 0, 0);
      groundPlane.receiveShadow = true;
      scene.add(groundPlane);
      const pedestal = new THREE.Mesh(cylinderGeometry, groundMaterial);
      pedestal.position.set(0, 0.5, 0);
      pedestal.receiveShadow = true;
      pedestal.castShadow = true;
      scene.add(pedestal);
      const sphereMesh = new THREE.InstancedMesh(sphereGeometry, objectMaterial, 6);
      sphereMesh.receiveShadow = true;
      sphereMesh.castShadow = true;
      scene.add(sphereMesh);
      [...Array(6).keys()].forEach((i) =>
        sphereMesh.setMatrixAt(
          i,
          new THREE.Matrix4().makeTranslation(
            Math.cos((Math.PI * i) / 3),
            0.5,
            Math.sin((Math.PI * i) / 3)
          )
        )
      );
      const lightSphereMesh = new THREE.InstancedMesh(lightSphereGeometry, emissiveMaterial, 4);
      scene.add(lightSphereMesh);
      [...Array(4).keys()].forEach((i) =>
        lightSphereMesh.setMatrixAt(
          i,
          new THREE.Matrix4().makeTranslation(
            0.4 * Math.cos((Math.PI * (i + 0.5)) / 2),
            1.1,
            0.45 * Math.sin((Math.PI * (i + 0.5)) / 2)
          )
        )
      );

      const updateGtaoMaterial = () => gtaoPass.updateGtaoMaterial(aoParameters);
      const updateOutput = () => {
        composer.removePass(gtaoPass);
        composer.insertPass(gtaoPass, sceneParameters.output == 1 ? 1 : 0);

        switch (sceneParameters.output) {
          default:
          case 0:
            gtaoPass.output = GTAOPass.OUTPUT.Off;
            gtaoPass.enabled = true;
            renderPasse.enabled = true;
            break;
          case 1:
            gtaoPass.output = GTAOPass.OUTPUT.Default;
            gtaoPass.enabled = true;
            renderPasse.enabled = true;
            break;
          case 2:
            gtaoPass.output = GTAOPass.OUTPUT.Diffuse;
            gtaoPass.enabled = false;
            renderPasse.enabled = true;
            break;
          case 3:
            gtaoPass.output = GTAOPass.OUTPUT.Denoise;
            gtaoPass.enabled = true;
            renderPasse.enabled = false;
            break;
        }

        groundMaterial.aoPassMap = sceneParameters.output === 0 ? gtaoPass.gtaoMap : null;
        objectMaterial.aoPassMap = sceneParameters.output === 0 ? gtaoPass.gtaoMap : null;
      };

      updateOutput();
      updateGtaoMaterial();

      const gui = new GUI();
      gui
        .add(sceneParameters, 'output', {
          'material AO': 0,
          'post blended AO': 1,
          'only diffuse': 2,
          'only AO': 3
        })
        .onChange(() => updateOutput());
      gui
        .add(sceneParameters, 'envMapIntensity')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(() => {
          groundMaterial.envMapIntensity = sceneParameters.envMapIntensity;
          objectMaterial.envMapIntensity = sceneParameters.envMapIntensity;
        });
      gui
        .add(sceneParameters, 'ambientLightIntensity')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(() => {
          ambientLight.intensity = sceneParameters.ambientLightIntensity;
        });
      gui
        .add(sceneParameters, 'lightIntensity')
        .min(0)
        .max(100)
        .step(1)
        .onChange(() => {
          lightGroup.children.forEach(
            (light) => (light.intensity = sceneParameters.lightIntensity)
          );
        });
      gui.add(sceneParameters, 'shadow').onChange((value) => {
        renderer.shadowMap.enabled = value;
        lightGroup.children.forEach((light) => (light.castShadow = value));
      });
      gui
        .add(aoParameters, 'radius')
        .min(0.01)
        .max(2)
        .step(0.01)
        .onChange(() => updateGtaoMaterial());
      gui
        .add(aoParameters, 'distanceExponent')
        .min(1)
        .max(4)
        .step(0.01)
        .onChange(() => updateGtaoMaterial());
      gui
        .add(aoParameters, 'thickness')
        .min(0.01)
        .max(10)
        .step(0.01)
        .onChange(() => updateGtaoMaterial());
      gui
        .add(aoParameters, 'distanceFallOff')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(() => updateGtaoMaterial());
      gui
        .add(aoParameters, 'scale')
        .min(0.01)
        .max(2.0)
        .step(0.01)
        .onChange(() => updateGtaoMaterial());
      gui
        .add(aoParameters, 'samples')
        .min(2)
        .max(32)
        .step(1)
        .onChange(() => updateGtaoMaterial());

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene, controls, composer, controls, rgbeloader, plyLoader);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    }

    function animate() {
      controls.update();
      stats.begin();
      composer.render();
      stats.end();
    }
  }
};
export { exampleInfo as default };
