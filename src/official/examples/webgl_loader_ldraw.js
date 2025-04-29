import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_loader_ldraw',
  useLoaders: { LDrawLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- LDrawLoader'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, controls, gui, guiData;

    let model;

    const ldrawPath = 'models/ldraw/officialLibrary/';

    const modelFileList = {
      Car: 'models/car.ldr_Packed.mpd',
      'Lunar Vehicle': 'models/1621-1-LunarMPVVehicle.mpd_Packed.mpd',
      'Radar Truck': 'models/889-1-RadarTruck.mpd_Packed.mpd',
      Trailer: 'models/4838-1-MiniVehicles.mpd_Packed.mpd',
      Bulldozer: 'models/4915-1-MiniConstruction.mpd_Packed.mpd',
      Helicopter: 'models/4918-1-MiniFlyers.mpd_Packed.mpd',
      Plane: 'models/5935-1-IslandHopper.mpd_Packed.mpd',
      Lighthouse: 'models/30023-1-Lighthouse.ldr_Packed.mpd',
      'X-Wing mini': 'models/30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
      'AT-ST mini': 'models/30054-1-AT-ST-Mini.mpd_Packed.mpd',
      'AT-AT mini': 'models/4489-1-AT-AT-Mini.mpd_Packed.mpd',
      Shuttle: 'models/4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
      'TIE Interceptor': 'models/6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
      'Star fighter': 'models/6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
      'X-Wing': 'models/7140-1-X-wingFighter.mpd_Packed.mpd',
      'AT-ST': 'models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd'
    };

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.set(150, 200, 250);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // scene

      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xdeebed);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      //

      guiData = {
        modelFileName: modelFileList['Car'],
        displayLines: true,
        conditionalLines: true,
        smoothNormals: true,
        buildingStep: 0,
        noBuildingSteps: 'No steps.',
        flatColors: false,
        mergeModel: false
      };

      window.addEventListener('resize', onWindowResize);

      // load materials and then the model

      reloadObject(true);

      needToDispose(renderer, scene, controls);
    }

    function updateObjectsVisibility() {
      model.traverse((c) => {
        if (c.isLineSegments) {
          if (c.isConditionalLine) {
            c.visible = guiData.conditionalLines;
          } else {
            c.visible = guiData.displayLines;
          }
        } else if (c.isGroup) {
          // Hide objects with building step > gui setting
          c.visible = c.userData.buildingStep <= guiData.buildingStep;
        }
      });
    }

    function reloadObject(resetCamera) {
      if (model) {
        scene.remove(model);
      }

      model = null;

      // only smooth when not rendering with flat colors to improve processing time
      const lDrawLoader = new LDrawLoader();
      lDrawLoader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
      lDrawLoader.smoothNormals = guiData.smoothNormals && !guiData.flatColors;
      lDrawLoader.setPath(ldrawPath).load(guiData.modelFileName, function (group2) {
        if (model) {
          scene.remove(model);
        }

        model = group2;

        // demonstrate how to use convert to flat colors to better mimic the lego instructions look
        if (guiData.flatColors) {
          function convertMaterial(material) {
            const newMaterial = new THREE.MeshBasicMaterial();
            newMaterial.color.copy(material.color);
            newMaterial.polygonOffset = material.polygonOffset;
            newMaterial.polygonOffsetUnits = material.polygonOffsetUnits;
            newMaterial.polygonOffsetFactor = material.polygonOffsetFactor;
            newMaterial.opacity = material.opacity;
            newMaterial.transparent = material.transparent;
            newMaterial.depthWrite = material.depthWrite;
            newMaterial.toneMapping = false;

            return newMaterial;
          }

          model.traverse((c) => {
            if (c.isMesh) {
              if (Array.isArray(c.material)) {
                c.material = c.material.map(convertMaterial);
              } else {
                c.material = convertMaterial(c.material);
              }
            }
          });
        }

        // Merge model geometries by material
        if (guiData.mergeModel) model = LDrawUtils.mergeObject(model);

        // Convert from LDraw coordinates: rotate 180 degrees around OX
        model.rotation.x = Math.PI;

        scene.add(model);

        guiData.buildingStep = model.userData.numBuildingSteps - 1;

        updateObjectsVisibility();

        // Adjust camera and light

        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, Math.max(size.y, size.z)) * 0.5;

        if (resetCamera) {
          controls.target0.copy(bbox.getCenter(new THREE.Vector3()));
          controls.position0.set(-2.3, 1, 2).multiplyScalar(radius).add(controls.target0);
          controls.reset();
        }

        createGUI();
      });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function createGUI() {
      if (gui) {
        gui.destroy();
      }

      gui = new GUI();

      gui
        .add(guiData, 'modelFileName', modelFileList)
        .name('Model')
        .onFinishChange(function () {
          reloadObject(true);
        });

      gui
        .add(guiData, 'flatColors')
        .name('Flat Colors')
        .onChange(function () {
          reloadObject(false);
        });

      gui
        .add(guiData, 'mergeModel')
        .name('Merge model')
        .onChange(function () {
          reloadObject(false);
        });

      if (model.userData.numBuildingSteps > 1) {
        gui
          .add(guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1)
          .step(1)
          .name('Building step')
          .onChange(updateObjectsVisibility);
      } else {
        gui.add(guiData, 'noBuildingSteps').name('Building step').onChange(updateObjectsVisibility);
      }

      gui
        .add(guiData, 'smoothNormals')
        .name('Smooth Normals')
        .onChange(function changeNormals() {
          reloadObject(false);
        });

      gui.add(guiData, 'displayLines').name('Display Lines').onChange(updateObjectsVisibility);
      gui
        .add(guiData, 'conditionalLines')
        .name('Conditional Lines')
        .onChange(updateObjectsVisibility);
    }

    //

    function animate() {
      controls.update();
      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
