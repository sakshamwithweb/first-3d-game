import * as THREE from "./three/build/three.module.js"
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";

class Game {
    constructor() {
        // variables
        this.glbLoader = new GLTFLoader();

        // Setups
        this.initSceneAndRenderer()
        this.initBasicSetup()
        this.resize()

        // Mid
        // this.createShape()
        this.loadModel()
        this.controlCharacter()

        // Render and animate()
        this.renderer.setAnimationLoop(this.animate.bind(this))
    }

    initSceneAndRenderer() {
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)
    }

    initBasicSetup() {
        // Camera, lightning, orbit controls, gridHelper

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.set(0, 4, 10)
        this.camera.lookAt(0, 0, 0)
        this.scene.add(this.camera)

        this.light = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(this.light)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        this.gridHelper = new THREE.GridHelper(100, 40)
        this.scene.add(this.gridHelper)
    }

    createShape() {
        const geometry = new THREE.SphereGeometry(5)
        const material = new THREE.MeshStandardMaterial({ color: 0xF54927, wireframe: true })

        this.sphereMesh = new THREE.Mesh(geometry, material)
        this.scene.add(this.sphereMesh)
    }

    // loadModel() {
    //     this.glbLoader.load('./model.glb', function (gltf) {
    //         this.carMesh = gltf.scene
    //         this.scene.add(this.carMesh)
    //     }.bind(this));
    // }

    loadModel() {
        this.glbLoader.load('./model.glb', function (gltf) {
            this.carMesh = gltf.scene
            this.carMesh.traverse((object) => {
                if (object.isMesh) object.castShadow = true
            })
            let allAnimations = gltf.animations
            let mixer = new THREE.AnimationMixer(this.carMesh)

            const animationMap = new Map()
            allAnimations.forEach((animation) => {
                animationMap.set(animation.name, mixer.clipAction)
            })
            this.scene.add(this.carMesh)
        }.bind(this));
    }

    controlCharacter() {
        this.keyPressed = {} // Why to make an object and store the keys rather than array?
        document.addEventListener('keydown', (e) => {
            this.keyPressed[e.key.toLowerCase()] = true
            console.log(this.keyPressed)
        },)
        document.addEventListener('keyup', (e) => {
            this.keyPressed[e.key.toLowerCase()] = false
            console.log(this.keyPressed)
        })
    }

    animate() {
        this.controls.update()
        this.render()
    }

    resize() {
        window.onresize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera)
    }
}

const game = new Game()