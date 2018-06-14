import * as THREE from 'three-full/builds/Three.es.min.js'

export default class ColorGrading {
  constructor () {
    this.width = window.innerWidth / 10 * 8
    this.height = this.width / 16 * 9

    this.textureLoader = new THREE.TextureLoader()
    this.ratio = this.width / this.height

    this.video = document.createElement('video')
    this.video.src = `./assets/video.mp4`

    this.video.loop = true
    this.video.muted = true
    this.video.preload = true

    this.video.width = this.width
    this.video.height = this.height

    this.video.oncanplay = this.startExperiment.bind(this)
  }

  startExperiment () {
    this.createWebGLEnvironment()
    this.createVideoGeometry()

    this.setColorGrading('Standard')

    this.video.play()
    this.onResize()
    this.render()
  }

  createWebGLEnvironment () {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, this.ratio, 1, 10000)
    this.camera.position.z = Math.round(this.height / 0.8275862)
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    document.body.appendChild(this.renderer.domElement)

    this.composer = new THREE.EffectComposer(this.renderer)
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))
  }

  createVideoGeometry () {
    this.videoTexture = new THREE.Texture(this.video)

    this.videoTexture.minFilter = THREE.LinearFilter
    this.videoTexture.magFilter = THREE.LinearFilter

    this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height, 1, 1),
      new THREE.MeshBasicMaterial({ map: this.videoTexture })
    ))
  }

  setColorGrading (lutTable, create = true) {
    this.textureLoader.load(`./assets/lut-tables/LUT_${lutTable}.png`, (texture) => {
      texture.minFilter = texture.magFilter = THREE.LinearFilter
      texture.needsUpdate = true

      if (create) {
        this.grading = new THREE.ShaderPass(
          new THREE.ShaderMaterial({
            fragmentShader: require('./glsl/grading.frag'),
            vertexShader: require('./glsl/grading.vert'),

            uniforms: {
              texture: { type: 't', value: this.videoTexture },
              grading: { type: 't', value: texture },
              isLookup: { type: 'i', value: 0 }
            }
          })
        )

        this.composer.addPass(this.grading)
        this.grading.renderToScreen = true        
      } else {
        const lookup = lutTable.includes('8x8') ? 1 : 0

        this.grading.material.uniforms.grading.value = texture
        this.grading.material.uniforms.isLookup.value = lookup
      }
    })
  }

  render () {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.videoTexture.needsUpdate = true
      this.composer.render()
    }

    this.frame = requestAnimationFrame(this.render.bind(this))
  }

  onResize () {
    this.width = window.innerWidth / 10 * 8
    this.height = this.width / 16 * 9

    this.video.width = this.width
    this.video.height = this.height

    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }
}
