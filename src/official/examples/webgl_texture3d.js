import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/examples/jsm/shaders/VolumeShader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_texture3d',
  useLoaders: { NRRDLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Float volume render test (mip / isosurface)'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let renderer, scene, camera, controls, material, volconfig, cmtextures;

    init();

    function init() {
      scene = new THREE.Scene();

      // Create renderer
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Create camera (The volume renderer does not work very well with perspective yet)
      const h = 512; // frustum height
      const aspect = window.innerWidth / window.innerHeight;
      camera = new THREE.OrthographicCamera(
        (-h * aspect) / 2,
        (h * aspect) / 2,
        h / 2,
        -h / 2,
        1,
        1000
      );
      camera.position.set(-64, -64, 128);
      camera.up.set(0, 0, 1); // In our data, z is up

      // Create controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.addEventListener('change', render);
      controls.target.set(64, 64, 128);
      controls.minZoom = 0.5;
      controls.maxZoom = 4;
      controls.enablePan = false;
      controls.update();

      // scene.add( new AxesHelper( 128 ) );

      // Lighting is baked into the shader a.t.m.
      // let dirLight = new DirectionalLight( 0xffffff );

      // The gui for interaction
      volconfig = {
        clim1: 0,
        clim2: 1,
        renderstyle: 'iso',
        isothreshold: 0.15,
        colormap: 'viridis'
      };
      const gui = new GUI();
      gui.add(volconfig, 'clim1', 0, 1, 0.01).onChange(updateUniforms);
      gui.add(volconfig, 'clim2', 0, 1, 0.01).onChange(updateUniforms);
      gui.add(volconfig, 'colormap', { gray: 'gray', viridis: 'viridis' }).onChange(updateUniforms);
      gui.add(volconfig, 'renderstyle', { mip: 'mip', iso: 'iso' }).onChange(updateUniforms);
      gui.add(volconfig, 'isothreshold', 0, 1, 0.01).onChange(updateUniforms);

      // Load the data ...
      new NRRDLoader().load('models/nrrd/stent.nrrd', function (volume) {
        // Texture to hold the volume. We have scalars, so we put our data in the red channel.
        // THREEJS will select R32F (33326) based on the THREE.RedFormat and THREE.FloatType.
        // Also see https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
        // TODO: look the dtype up in the volume metadata
        const texture = new THREE.Data3DTexture(
          volume.data,
          volume.xLength,
          volume.yLength,
          volume.zLength
        );
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        // Colormap textures
        cmtextures = {
          viridis: new THREE.TextureLoader().load('textures/cm_viridis.png', render),
          gray: new THREE.TextureLoader().load('textures/cm_gray.png', render)
        };

        // Material
        const shader = VolumeRenderShader1;

        const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['u_data'].value = texture;
        uniforms['u_size'].value.set(volume.xLength, volume.yLength, volume.zLength);
        uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
        uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
        uniforms['u_renderthreshold'].value = volconfig.isothreshold; // For ISO renderstyle
        uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];

        material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide // The volume shader uses the backface as its "reference point"
        });

        // THREE.Mesh
        const geometry = new THREE.BoxGeometry(volume.xLength, volume.yLength, volume.zLength);
        geometry.translate(
          volume.xLength / 2 - 0.5,
          volume.yLength / 2 - 0.5,
          volume.zLength / 2 - 0.5
        );

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        render();
      });

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function updateUniforms() {
      material.uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
      material.uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
      material.uniforms['u_renderthreshold'].value = volconfig.isothreshold; // For ISO renderstyle
      material.uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];

      render();
    }

    function onWindowResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      const aspect = window.innerWidth / window.innerHeight;

      const frustumHeight = camera.top - camera.bottom;

      camera.left = (-frustumHeight * aspect) / 2;
      camera.right = (frustumHeight * aspect) / 2;

      camera.updateProjectionMatrix();

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
