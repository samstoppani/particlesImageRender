import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import vertexShader from './shaders/test/vertex.glsl'
import fragmentShader from './shaders/test/fragment.glsl'

import Particles  from './Particles'

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

/**
 * Create particles image
 */
var images = [

    { path: './textures/image-01.jpg', width: 300 * 3/4, height: 129 * 3/4},
    { path: './textures/image-02.jpg', width: 250 , height: 197 },
    { path: './textures/image-03.jpg', width: 200 , height: 200 },
    { path: './textures/image-04.jpg', width: 300 , height: 158 },
    { path: './textures/image-05.jpg', width: 250 , height: 146 },
    { path: './textures/image-06.jpg', width: 250 , height: 141 },

]
var imageIndex = 0

var particles = new Particles(scene, textureLoader, vertexShader, fragmentShader, images[imageIndex].path)
particles.createParticles(images[imageIndex].width, images[imageIndex].height)

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
 * Particle interactivity
 */

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const parent = document.querySelector(".content");

window.addEventListener('mousemove', (event) => {
 
    mouse.x = (event.clientX / sizes.width * 2) - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

})

parent.addEventListener('touchmove', (event) => {

    mouse.x = (event.touches[0].clientX / sizes.width * 2) - 1
    mouse.y = - (event.touches[0].clientY / sizes.height) * 2 + 1

})



parent.addEventListener('click', () => {

    particles.destroyParticles()

    setTimeout( function() {
        if (imageIndex >= images.length - 1) {
            imageIndex = 0
        }   
        else {
            imageIndex++
        }
    
        const nextImage = images[imageIndex]
    
        particles.src = nextImage.path
        particles.dispersion = 100;
        particles.initTexture()
        particles.createParticles(nextImage.width, nextImage.height)

        document.getElementById('imageNumber').innerHTML = imageIndex + 1
    }, 1500)


})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(0.25, - 0.25, 200)
scene.add(camera)


// // Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Cast a ray and update particles on mouse move
    raycaster.setFromCamera(mouse, camera)

    const objectsToIntersect = [particles.plane]
    const intersects = raycaster.intersectObjects(objectsToIntersect)   

    for (const intersect of intersects) {
        particles.updateTouchTrail(intersect.uv)
    }
    particles.updateParticles(elapsedTime)

    // // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()