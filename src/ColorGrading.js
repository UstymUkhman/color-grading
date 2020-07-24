import { MeshBasicMaterial } from '@three/materials/MeshBasicMaterial';
import { PerspectiveCamera } from '@three/cameras/PerspectiveCamera';
import { ShaderMaterial } from '@three/materials/ShaderMaterial';
import { WebGL1Renderer } from '@three/renderers/WebGL1Renderer';
import { EffectComposer } from '@postprocessing/EffectComposer';
import { PlaneGeometry } from '@three/geometries/PlaneGeometry';
import { TextureLoader } from '@three/loaders/TextureLoader';
import { Pass } from '@postprocessing/Pass';

import { RenderPass } from '@postprocessing/RenderPass';
// import { ShaderPass } from '@postprocessing/ShaderPass';
import { Texture } from '@three/textures/Texture';
import { LinearFilter } from '@three/constants';
import { Scene } from '@three/scenes/Scene';
import { Mesh } from '@three/objects/Mesh';

import * as THREE from 'three/build/three.min.js';

THREE.ShaderMaterial = ShaderMaterial;
THREE.Pass = Pass;
window.THREE = THREE;

require('three/examples/js/postprocessing/ShaderPass');

import fragGrading from '@/glsl/grading.frag';
import vertGrading from '@/glsl/grading.vert';

export default class ColorGrading {
  constructor () {
    this.width = window.innerWidth;
    this.height = this.width / 16 * 9;

    this.ratio = this.width / this.height;
    this.textureLoader = new TextureLoader();

    this.createVideoStream();
  }

  createVideoStream () {
    this.video = document.createElement('video');
    this.video.oncanplay = this.init.bind(this);
    this.video.src = './assets/video/lake.mp4';

    this.video.height = this.height;
    this.video.width = this.width;

    this.video.preload = 'auto';
    this.video.autoload = true;

    this.video.muted = true;
    this.video.loop = true;
  }

  init () {
    if (this.renderer) return;

    this.createWebGLEnvironment();
    this.createVideoGeometry();
    this.setColorGrading();

    this.video.play();
    this.onResize();
    this.render();
  }

  createWebGLEnvironment () {
    this.renderer = new WebGL1Renderer({ antialias: true, alpha: false });

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(45, this.ratio, 1, 10000);
    this.camera.position.z = Math.round(this.height / 0.8275862);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.width, this.height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
  }

  createVideoGeometry () {
    this.videoTexture = new Texture(this.video);

    this.videoTexture.minFilter = LinearFilter;
    this.videoTexture.magFilter = LinearFilter;

    this.scene.add(new Mesh(
      new PlaneGeometry(this.width, this.height, 1, 1),
      new MeshBasicMaterial({ map: this.videoTexture })
    ));
  }

  setColorGrading (lutTable = 'Standard', create = true) {
    this.textureLoader.load(`./assets/LUT/${lutTable}.png`, texture => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;

      if (create) {
        this.grading = new THREE.ShaderPass(
          new ShaderMaterial({
            fragmentShader: fragGrading,
            vertexShader: vertGrading,

            uniforms: {
              frame: { type: 't', value: this.videoTexture },
              grading: { type: 't', value: texture },
              isLookup: { type: 'b', value: false }
            }
          })
        );

        this.composer.addPass(this.grading);
      } else {
        const lookup = lutTable.includes('8x8');

        this.grading.material.uniforms.grading.value = texture;
        this.grading.material.uniforms.isLookup.value = lookup;
      }
    });
  }

  onResize () {
    let height = window.innerHeight;
    let width = window.innerWidth;

    if (width > height) {
      height = width / 16 * 9;
    } else {
      width = height / 9 * 16;
    }

    this.video.height = height;
    this.video.width = width;

    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.composer.setSize(width, height);
      this.camera.updateProjectionMatrix();

    }
  }

  render () {
    this.frame = requestAnimationFrame(this.render.bind(this));

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.videoTexture.needsUpdate = true;
      this.composer.render();
    }
  }
}
