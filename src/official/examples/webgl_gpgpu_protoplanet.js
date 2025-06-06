import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_gpgpu_protoplanet',
  useLoaders: {},
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [{ tag: 'text', content: 'webgl gpgpu debris' }]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    // Texture width for simulation (each texel is a debris particle)
    const WIDTH = 64;

    let stats;
    let camera, scene, renderer, geometry;

    const PARTICLES = WIDTH * WIDTH;

    let gpuCompute;
    let velocityVariable;
    let positionVariable;
    let velocityUniforms;
    let particleUniforms;
    let effectController;

    init();

    function init() {
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 5, 15000);
      camera.position.y = 120;
      camera.position.z = 400;

      scene = new THREE.Scene();

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 100;
      controls.maxDistance = 1000;

      effectController = {
        // Can be changed dynamically
        gravityConstant: 100.0,
        density: 0.45,

        // Must restart simulation
        radius: 300,
        height: 8,
        exponent: 0.4,
        maxMass: 15.0,
        velocity: 70,
        velocityExponent: 0.2,
        randVelocity: 0.001
      };

      initComputeRenderer();

      stats = new Stats(renderer);

      window.addEventListener('resize', onWindowResize);

      initGUI();

      initProtoplanets();

      dynamicValuesChanger();

      needToDispose(renderer, scene, controls);
    }

    function initComputeRenderer() {
      gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

      const dtPosition = gpuCompute.createTexture();
      const dtVelocity = gpuCompute.createTexture();

      fillTextures(dtPosition, dtVelocity);

      velocityVariable = gpuCompute.addVariable(
        'textureVelocity',
        `
			// For PI declaration:
			#include <common>
			#define delta ( 1.0 / 60.0 )
			uniform float gravityConstant;
			uniform float density;
			const float width = resolution.x;
			const float height = resolution.y;
			float radiusFromMass( float mass ) {
				// Calculate radius of a sphere from mass and density
				return pow( ( 3.0 / ( 4.0 * PI ) ) * mass / density, 1.0 / 3.0 );
			}
			void main()	{
				vec2 uv = gl_FragCoord.xy / resolution.xy;
				float idParticle = uv.y * resolution.x + uv.x;
				vec4 tmpPos = texture2D( texturePosition, uv );
				vec3 pos = tmpPos.xyz;
				vec4 tmpVel = texture2D( textureVelocity, uv );
				vec3 vel = tmpVel.xyz;
				float mass = tmpVel.w;
				if ( mass > 0.0 ) {
					float radius = radiusFromMass( mass );
					vec3 acceleration = vec3( 0.0 );
					// Gravity interaction
					for ( float y = 0.0; y < height; y++ ) {
						for ( float x = 0.0; x < width; x++ ) {
							vec2 secondParticleCoords = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
							vec3 pos2 = texture2D( texturePosition, secondParticleCoords ).xyz;
							vec4 velTemp2 = texture2D( textureVelocity, secondParticleCoords );
							vec3 vel2 = velTemp2.xyz;
							float mass2 = velTemp2.w;
							float idParticle2 = secondParticleCoords.y * resolution.x + secondParticleCoords.x;
							if ( idParticle == idParticle2 ) {
								continue;
							}
							if ( mass2 == 0.0 ) {
								continue;
							}
							vec3 dPos = pos2 - pos;
							float distance = length( dPos );
							float radius2 = radiusFromMass( mass2 );
							if ( distance == 0.0 ) {
								continue;
							}
							// Checks collision
							if ( distance < radius + radius2 ) {
								if ( idParticle < idParticle2 ) {
									// This particle is aggregated by the other
									vel = ( vel * mass + vel2 * mass2 ) / ( mass + mass2 );
									mass += mass2;
									radius = radiusFromMass( mass );
								}
								else {
									// This particle dies
									mass = 0.0;
									radius = 0.0;
									vel = vec3( 0.0 );
									break;
								}
							}
							float distanceSq = distance * distance;
							float gravityField = gravityConstant * mass2 / distanceSq;
							gravityField = min( gravityField, 1000.0 );
							acceleration += gravityField * normalize( dPos );
						}
						if ( mass == 0.0 ) {
							break;
						}
					}
					// Dynamics
					vel += delta * acceleration;
				}
				gl_FragColor = vec4( vel, mass );
			}
		`,
        dtVelocity
      );
      positionVariable = gpuCompute.addVariable(
        'texturePosition',
        `
			#define delta ( 1.0 / 60.0 )
			void main() {
				vec2 uv = gl_FragCoord.xy / resolution.xy;
				vec4 tmpPos = texture2D( texturePosition, uv );
				vec3 pos = tmpPos.xyz;
				vec4 tmpVel = texture2D( textureVelocity, uv );
				vec3 vel = tmpVel.xyz;
				float mass = tmpVel.w;
				if ( mass == 0.0 ) {
					vel = vec3( 0.0 );
				}
				// Dynamics
				pos += vel * delta;
				gl_FragColor = vec4( pos, 1.0 );
			}
		`,
        dtPosition
      );

      gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
      gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

      velocityUniforms = velocityVariable.material.uniforms;

      velocityUniforms['gravityConstant'] = { value: 0.0 };
      velocityUniforms['density'] = { value: 0.0 };

      const error = gpuCompute.init();

      if (error !== null) {
        console.error(error);
      }
    }

    function restartSimulation() {
      const dtPosition = gpuCompute.createTexture();
      const dtVelocity = gpuCompute.createTexture();

      fillTextures(dtPosition, dtVelocity);

      gpuCompute.renderTexture(dtPosition, positionVariable.renderTargets[0]);
      gpuCompute.renderTexture(dtPosition, positionVariable.renderTargets[1]);
      gpuCompute.renderTexture(dtVelocity, velocityVariable.renderTargets[0]);
      gpuCompute.renderTexture(dtVelocity, velocityVariable.renderTargets[1]);
    }

    function initProtoplanets() {
      geometry = new THREE.BufferGeometry();

      const positions = new Float32Array(PARTICLES * 3);
      let p = 0;

      for (let i = 0; i < PARTICLES; i++) {
        positions[p++] = (Math.random() * 2 - 1) * effectController.radius;
        positions[p++] = 0; //( Math.random() * 2 - 1 ) * effectController.radius;
        positions[p++] = (Math.random() * 2 - 1) * effectController.radius;
      }

      const uvs = new Float32Array(PARTICLES * 2);
      p = 0;

      for (let j = 0; j < WIDTH; j++) {
        for (let i = 0; i < WIDTH; i++) {
          uvs[p++] = i / (WIDTH - 1);
          uvs[p++] = j / (WIDTH - 1);
        }
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      particleUniforms = {
        texturePosition: { value: null },
        textureVelocity: { value: null },
        cameraConstant: { value: getCameraConstant(camera) },
        density: { value: 0.0 }
      };

      // THREE.ShaderMaterial
      const material = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader: `
			// For PI declaration:
			#include <common>
			uniform sampler2D texturePosition;
			uniform sampler2D textureVelocity;
			uniform float cameraConstant;
			uniform float density;
			varying vec4 vColor;
			float radiusFromMass( float mass ) {
				// Calculate radius of a sphere from mass and density
				return pow( ( 3.0 / ( 4.0 * PI ) ) * mass / density, 1.0 / 3.0 );
			}
			void main() {
				vec4 posTemp = texture2D( texturePosition, uv );
				vec3 pos = posTemp.xyz;
				vec4 velTemp = texture2D( textureVelocity, uv );
				vec3 vel = velTemp.xyz;
				float mass = velTemp.w;
				vColor = vec4( 1.0, mass / 250.0, 0.0, 1.0 );
				vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
				// Calculate radius of a sphere from mass and density
				//float radius = pow( ( 3.0 / ( 4.0 * PI ) ) * mass / density, 1.0 / 3.0 );
				float radius = radiusFromMass( mass );
				// Apparent size in pixels
				if ( mass == 0.0 ) {
					gl_PointSize = 0.0;
				}
				else {
					gl_PointSize = radius * cameraConstant / ( - mvPosition.z );
				}
				gl_Position = projectionMatrix * mvPosition;
			}
		`,
        fragmentShader: `
			varying vec4 vColor;
			void main() {
				if ( vColor.y == 0.0 ) discard;
				float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
				if ( f > 0.5 ) {
					discard;
				}
				gl_FragColor = vColor;
			}
		`
      });

      const particles = new THREE.Points(geometry, material);
      particles.matrixAutoUpdate = false;
      particles.updateMatrix();

      scene.add(particles);
    }

    function fillTextures(texturePosition, textureVelocity) {
      const posArray = texturePosition.image.data;
      const velArray = textureVelocity.image.data;

      const radius = effectController.radius;
      const height = effectController.height;
      const exponent = effectController.exponent;
      const maxMass = (effectController.maxMass * 1024) / PARTICLES;
      const maxVel = effectController.velocity;
      const velExponent = effectController.velocityExponent;
      const randVel = effectController.randVelocity;

      for (let k = 0, kl = posArray.length; k < kl; k += 4) {
        // Position
        let x, z, rr;

        do {
          x = Math.random() * 2 - 1;
          z = Math.random() * 2 - 1;
          rr = x * x + z * z;
        } while (rr > 1);

        rr = Math.sqrt(rr);

        const rExp = radius * Math.pow(rr, exponent);

        // Velocity
        const vel = maxVel * Math.pow(rr, velExponent);

        const vx = vel * z + (Math.random() * 2 - 1) * randVel;
        const vy = (Math.random() * 2 - 1) * randVel * 0.05;
        const vz = -vel * x + (Math.random() * 2 - 1) * randVel;

        x *= rExp;
        z *= rExp;
        const y = (Math.random() * 2 - 1) * height;

        const mass = Math.random() * maxMass + 1;

        // Fill in texture values
        posArray[k + 0] = x;
        posArray[k + 1] = y;
        posArray[k + 2] = z;
        posArray[k + 3] = 1;

        velArray[k + 0] = vx;
        velArray[k + 1] = vy;
        velArray[k + 2] = vz;
        velArray[k + 3] = mass;
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      particleUniforms['cameraConstant'].value = getCameraConstant(camera);
    }

    function dynamicValuesChanger() {
      velocityUniforms['gravityConstant'].value = effectController.gravityConstant;
      velocityUniforms['density'].value = effectController.density;
      particleUniforms['density'].value = effectController.density;
    }

    function initGUI() {
      const gui = new GUI({ width: 280 });

      const folder1 = gui.addFolder('Dynamic parameters');

      folder1
        .add(effectController, 'gravityConstant', 0.0, 1000.0, 0.05)
        .onChange(dynamicValuesChanger);
      folder1.add(effectController, 'density', 0.0, 10.0, 0.001).onChange(dynamicValuesChanger);

      const folder2 = gui.addFolder('Static parameters');

      folder2.add(effectController, 'radius', 10.0, 1000.0, 1.0);
      folder2.add(effectController, 'height', 0.0, 50.0, 0.01);
      folder2.add(effectController, 'exponent', 0.0, 2.0, 0.001);
      folder2.add(effectController, 'maxMass', 1.0, 50.0, 0.1);
      folder2.add(effectController, 'velocity', 0.0, 150.0, 0.1);
      folder2.add(effectController, 'velocityExponent', 0.0, 1.0, 0.01);
      folder2.add(effectController, 'randVelocity', 0.0, 50.0, 0.1);

      const buttonRestart = {
        restartSimulation: function () {
          restartSimulation();
        }
      };

      folder2.add(buttonRestart, 'restartSimulation');

      folder1.open();
      folder2.open();
    }

    function getCameraConstant(camera) {
      return (
        window.innerHeight / (Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov) / camera.zoom)
      );
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      gpuCompute.compute();

      particleUniforms['texturePosition'].value =
        gpuCompute.getCurrentRenderTarget(positionVariable).texture;
      particleUniforms['textureVelocity'].value =
        gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
