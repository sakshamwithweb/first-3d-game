import { CharacterControls } from "./character.js";
import * as THREE from "../../three/build/three.module.js"
import { OrbitControls } from "../../three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "../../three/examples/jsm/loaders/GLTFLoader.js";

class Game {
    constructor() {
        // variables
        this.glbLoader = new GLTFLoader();
        this.clock = new THREE.Clock();

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

    loadModel() {
        this.glbLoader.load('./assets/model.glb', function (gltf) {
            this.carMesh = gltf.scene
            this.carMesh.traverse((object) => {
                if (object.isMesh) object.castShadow = true
            })

            const idleClip = new THREE.AnimationClip("idle", 3, [])
            gltf.animations.push(idleClip) // insert idle animation

            let allAnimations = gltf.animations
            let mixer = new THREE.AnimationMixer(this.carMesh)

            const animationsMap = new Map()
            allAnimations.forEach((a) => {
                animationsMap.set(a.name, mixer.clipAction(a))
            })

            this.characterControls = new CharacterControls(this.carMesh, mixer, animationsMap, this.controls, this.camera, "idle") // Instantiate CharacterControls as well as keep the player(car) in idle mode

            this.scene.add(this.carMesh)
        }.bind(this));
    }

    controlCharacter() {
        this.keyPressed = {} // Why to make an object and store the keys rather than array?
        document.addEventListener('keydown', (e) => {
            this.keyPressed[e.key.toLowerCase()] = true
        },)
        document.addEventListener('keyup', (e) => {
            this.keyPressed[e.key.toLowerCase()] = false
        })
    }

    animate() {
        this.controls.update()

        if (this.characterControls) {
            // Here update the actions, state or whatevea
            this.characterControls.update(this.clock.getDelta(), this.keyPressed)
        }

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