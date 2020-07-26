import { MeshBasicMaterial } from '@three/materials/MeshBasicMaterial';
import { PerspectiveCamera } from '@three/cameras/PerspectiveCamera';
import { ShaderMaterial } from '@three/materials/ShaderMaterial';
import { WebGL1Renderer } from '@three/renderers/WebGL1Renderer';
import { EffectComposer } from '@postprocessing/EffectComposer';
import { PlaneGeometry } from '@three/geometries/PlaneGeometry';
import { TextureLoader } from '@three/loaders/TextureLoader';
import { VideoTexture } from '@three/textures/VideoTexture';

import { RenderPass } from '@postprocessing/RenderPass';
import { ShaderPass } from '@postprocessing/ShaderPass';
import { LinearFilter } from '@three/constants';
import fragGrading from '@/glsl/grading.frag';
import vertGrading from '@/glsl/grading.vert';
import { Scene } from '@three/scenes/Scene';
import { Mesh } from '@three/objects/Mesh';

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
    this.renderer = new WebGL1Renderer();

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(45, this.ratio, 1, 10000);
    this.camera.position.z = Math.round(this.height / 0.8275862);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
  }

  createVideoGeometry () {
    this.videoTexture = new VideoTexture(this.video);

    this.videoTexture.minFilter = LinearFilter;
    this.videoTexture.magFilter = LinearFilter;

    this.grading = new ShaderPass(
      new ShaderMaterial({
        fragmentShader: fragGrading,
        vertexShader: vertGrading,

        uniforms: {
          frame: { value: this.videoTexture },
          isLookup: { value: false },
          grading: { value: null }
        }
      })
    );

    this.scene.add(new Mesh(
      new PlaneGeometry(this.width, this.height, 1, 1),
      new MeshBasicMaterial({ map: this.videoTexture })
    ));

    this.composer.addPass(this.grading);
  }

  setColorGrading (lutTable = 'Standard') {
    this.textureLoader.load(`./assets/LUT/${lutTable}.png`, texture => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;

      this.grading.material.uniforms.isLookup.value = lutTable.includes('8x8');
      this.grading.material.uniforms.grading.value = texture;
    });
  }

  onResize () {
    this.height = window.innerHeight;
    this.width = window.innerWidth;

    if (this.width > this.height) {
      this.height = this.width / 16 * 9;
    } else {
      this.width = this.height / 9 * 16;
    }

    this.renderer.setSize(this.width, this.height);

    this.video.height = this.height;
    this.video.width = this.width;
  }

  render () {
    this.frame = requestAnimationFrame(this.render.bind(this));
    this.composer.render();
  }
}
