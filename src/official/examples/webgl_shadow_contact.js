import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_shadow_contact',
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
        content: 'webgl - contact shadows'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, stats, gui;

    const meshes = [];

    const PLANE_WIDTH = 2.5;
    const PLANE_HEIGHT = 2.5;
    const CAMERA_HEIGHT = 0.3;

    const state = {
      shadow: {
        blur: 3.5,
        darkness: 1,
        opacity: 1
      },
      plane: {
        color: '#ffffff',
        opacity: 1
      },
      showWireframe: false
    };

    let shadowGroup,
      renderTarget,
      renderTargetBlur,
      shadowCamera,
      cameraHelper,
      depthMaterial,
      horizontalBlurMaterial,
      verticalBlurMaterial;

    let plane, blurPlane, fillPlane;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0.5, 1, 2);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      // add the example meshes

      const geometries = [
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        new THREE.IcosahedronGeometry(0.3),
        new THREE.TorusKnotGeometry(0.4, 0.05, 256, 24, 1, 3)
      ];

      const material = new THREE.MeshNormalMaterial();

      for (let i = 0, l = geometries.length; i < l; i++) {
        const angle = (i / l) * Math.PI * 2;

        const geometry = geometries[i];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.1;
        mesh.position.x = Math.cos(angle) / 2.0;
        mesh.position.z = Math.sin(angle) / 2.0;
        scene.add(mesh);
        meshes.push(mesh);
      }

      // the container, if you need to move the plane just move this
      shadowGroup = new THREE.Group();
      shadowGroup.position.y = -0.3;
      scene.add(shadowGroup);

      // the render target that will show the shadows in the plane texture
      renderTarget = new THREE.WebGLRenderTarget(512, 512);
      renderTarget.texture.generateMipmaps = false;

      // the render target that we will use to blur the first render target
      renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
      renderTargetBlur.texture.generateMipmaps = false;

      // make a plane and make it face up
      const planeGeometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT).rotateX(Math.PI / 2);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: renderTarget.texture,
        opacity: state.shadow.opacity,
        transparent: true,
        depthWrite: false
      });
      plane = new THREE.Mesh(planeGeometry, planeMaterial);
      // make sure it's rendered after the fillPlane
      plane.renderOrder = 1;
      shadowGroup.add(plane);

      // the y from the texture is flipped!
      plane.scale.y = -1;

      // the plane onto which to blur the texture
      blurPlane = new THREE.Mesh(planeGeometry);
      blurPlane.visible = false;
      shadowGroup.add(blurPlane);

      // the plane with the color of the ground
      const fillPlaneMaterial = new THREE.MeshBasicMaterial({
        color: state.plane.color,
        opacity: state.plane.opacity,
        transparent: true,
        depthWrite: false
      });
      fillPlane = new THREE.Mesh(planeGeometry, fillPlaneMaterial);
      fillPlane.rotateX(Math.PI);
      shadowGroup.add(fillPlane);

      // the camera to render the depth material from
      shadowCamera = new THREE.OrthographicCamera(
        -PLANE_WIDTH / 2,
        PLANE_WIDTH / 2,
        PLANE_HEIGHT / 2,
        -PLANE_HEIGHT / 2,
        0,
        CAMERA_HEIGHT
      );
      shadowCamera.rotation.x = Math.PI / 2; // get the camera to look up
      shadowGroup.add(shadowCamera);

      cameraHelper = new THREE.CameraHelper(shadowCamera);

      // like MeshDepthMaterial, but goes from black to transparent
      depthMaterial = new THREE.MeshDepthMaterial();
      depthMaterial.userData.darkness = { value: state.shadow.darkness };
      depthMaterial.onBeforeCompile = function (shader) {
        shader.uniforms.darkness = depthMaterial.userData.darkness;
        shader.fragmentShader = /* glsl */ `
						uniform float darkness;
						${shader.fragmentShader.replace(
              'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
              'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
            )}
					`;
      };

      depthMaterial.depthTest = false;
      depthMaterial.depthWrite = false;

      horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
      horizontalBlurMaterial.depthTest = false;

      verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
      verticalBlurMaterial.depthTest = false;

      //

      gui = new GUI();
      const shadowFolder = gui.addFolder('shadow');
      shadowFolder.open();
      const planeFolder = gui.addFolder('plane');
      planeFolder.open();

      shadowFolder.add(state.shadow, 'blur', 0, 15, 0.1);
      shadowFolder.add(state.shadow, 'darkness', 1, 5, 0.1).onChange(function () {
        depthMaterial.userData.darkness.value = state.shadow.darkness;
      });
      shadowFolder.add(state.shadow, 'opacity', 0, 1, 0.01).onChange(function () {
        plane.material.opacity = state.shadow.opacity;
      });
      planeFolder.addColor(state.plane, 'color').onChange(function () {
        fillPlane.material.color = new THREE.Color(state.plane.color);
      });
      planeFolder.add(state.plane, 'opacity', 0, 1, 0.01).onChange(function () {
        fillPlane.material.opacity = state.plane.opacity;
      });

      gui.add(state, 'showWireframe').onChange(function () {
        if (state.showWireframe) {
          scene.add(cameraHelper);
        } else {
          scene.remove(cameraHelper);
        }
      });

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      const controls = new OrbitControls(camera, renderer.domElement);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // renderTarget --> blurPlane (horizontalBlur) --> renderTargetBlur --> blurPlane (verticalBlur) --> renderTarget
    function blurShadow(amount) {
      blurPlane.visible = true;

      // blur horizontally and draw in the renderTargetBlur
      blurPlane.material = horizontalBlurMaterial;
      blurPlane.material.uniforms.tDiffuse.value = renderTarget.texture;
      horizontalBlurMaterial.uniforms.h.value = (amount * 1) / 256;

      renderer.setRenderTarget(renderTargetBlur);
      renderer.render(blurPlane, shadowCamera);

      // blur vertically and draw in the main renderTarget
      blurPlane.material = verticalBlurMaterial;
      blurPlane.material.uniforms.tDiffuse.value = renderTargetBlur.texture;
      verticalBlurMaterial.uniforms.v.value = (amount * 1) / 256;

      renderer.setRenderTarget(renderTarget);
      renderer.render(blurPlane, shadowCamera);

      blurPlane.visible = false;
    }

    function animate() {
      meshes.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
      });

      //

      // remove the background
      const initialBackground = scene.background;
      scene.background = null;

      // force the depthMaterial to everything
      cameraHelper.visible = false;
      scene.overrideMaterial = depthMaterial;

      // set renderer clear alpha
      const initialClearAlpha = renderer.getClearAlpha();
      renderer.setClearAlpha(0);

      // render to the render target to get the depths
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, shadowCamera);

      // and reset the override material
      scene.overrideMaterial = null;
      cameraHelper.visible = true;

      blurShadow(state.shadow.blur);

      // a second pass to reduce the artifacts
      // (0.4 is the minimum blur amout so that the artifacts are gone)
      blurShadow(state.shadow.blur * 0.4);

      // reset and render the normal scene
      renderer.setRenderTarget(null);
      renderer.setClearAlpha(initialClearAlpha);
      scene.background = initialBackground;

      renderer.render(scene, camera);
      stats.update();
    }
  }
};
export { exampleInfo as default };
