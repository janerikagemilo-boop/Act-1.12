import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('textures/matcaps/8.png')
// Improve texture quality and color handling
matcapTexture.colorSpace = THREE.SRGBColorSpace
matcapTexture.minFilter = THREE.LinearMipmapLinearFilter
matcapTexture.magFilter = THREE.LinearFilter
// Expanded matcap id range
const MAX_MATCAP_ID = 14
const matcapOptions = Array.from({ length: MAX_MATCAP_ID }, (_, i) => String(i + 1))


// Customizable material parameters
const params = {
    tint: '#ffffff',
    opacity: 1,
    flatShading: false,
    wireframe: false,
    exposure: 1,
    matcapId: '8',
    side: 'Front',
    depthWrite: true,
    depthTest: true
}

/**
 * Fonts
 */
const fontLoader = new FontLoader()

fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) =>
    {
        // Material
        const material = new THREE.MeshMatcapMaterial({
            matcap: matcapTexture,
            color: new THREE.Color(params.tint),
            flatShading: params.flatShading,
            transparent: true,
            opacity: params.opacity,
            wireframe: params.wireframe,
            side: params.side === 'Front' ? THREE.FrontSide : params.side === 'Back' ? THREE.BackSide : THREE.DoubleSide,
            depthWrite: params.depthWrite,
            depthTest: params.depthTest
        })

        // Text
        const textGeometry = new TextGeometry(
            'Hello Three.js',
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            }
        )
        textGeometry.center()

        const text = new THREE.Mesh(textGeometry, material)
        scene.add(text)

        // Donuts
        const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 32, 64)

        for(let i = 0; i < 100; i++)
        {
            const donut = new THREE.Mesh(donutGeometry, material)
            donut.position.x = (Math.random() - 0.5) * 10
            donut.position.y = (Math.random() - 0.5) * 10
            donut.position.z = (Math.random() - 0.5) * 10
            donut.rotation.x = Math.random() * Math.PI
            donut.rotation.y = Math.random() * Math.PI
            const scale = Math.random()
            donut.scale.set(scale, scale, scale)

            scene.add(donut)
        }

        // Single controls panel (root) with requested options only

        // Unified texture settings
        const applyMatcapSettings = (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.magFilter = THREE.LinearFilter
            tex.anisotropy = (renderer?.capabilities?.getMaxAnisotropy?.() ?? 8)
        }
        const loadMatcapById = (id) => {
            const onSuccess = (tex) => {
                applyMatcapSettings(tex)
                material.matcap = tex
                material.needsUpdate = true
            }
            const loadFallback = () => {
                textureLoader.load('textures/matcaps/8.png', (fallback) => {
                    applyMatcapSettings(fallback)
                    material.matcap = fallback
                    material.needsUpdate = true
                })
            }
            const tryJpg = () => {
                textureLoader.load(`textures/matcaps/${id}.jpg`, onSuccess, undefined, loadFallback)
            }
            // Try PNG first, then JPG, then fallback
            textureLoader.load(`textures/matcaps/${id}.png`, onSuccess, undefined, tryJpg)
        }

        // Required controls (attached to root gui)
        gui.addColor(params, 'tint').name('Tint').onChange((v) => { material.color.set(v) })
        gui.add(params, 'opacity', 0, 1, 0.01).name('Opacity').onChange((v) => { material.opacity = v; material.transparent = v < 1; material.needsUpdate = true })
        gui.add(params, 'flatShading').name('Flat').onChange((v) => { material.flatShading = v; material.needsUpdate = true })
        gui.add(params, 'wireframe').name('Wireframe').onChange((v) => { material.wireframe = v })
        gui.add(params, 'side', ['Front','Back','Double']).name('Side').onChange((s) => { material.side = s === 'Front' ? THREE.FrontSide : s === 'Back' ? THREE.BackSide : THREE.DoubleSide; material.needsUpdate = true })
        gui.add(params, 'depthWrite').name('Depth Write').onChange((v) => { material.depthWrite = v })
        gui.add(params, 'depthTest').name('Depth Test').onChange((v) => { material.depthTest = v })
        gui.add(params, 'exposure', 0.5, 2, 0.01).name('Exposure').onChange((v) => { renderer.toneMappingExposure = v })
        gui.add(params, 'matcapId', matcapOptions).name('Matcaps').onChange((id) => { loadMatcapById(id) })

        // Initialize matcap with current id
        loadMatcapById(params.matcapId)


    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// Consistent output and tone mapping for visually pleasing results
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = params.exposure
// Max anisotropy for crisper matcap sampling
matcapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()