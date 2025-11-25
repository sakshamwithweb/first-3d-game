import { CharacterControls } from "./character.js";
import * as THREE from "../../three/build/three.module.js"
import { OrbitControls } from "../../three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "../../three/examples/jsm/loaders/GLTFLoader.js";
import { deg2rad } from "./utils.js";

class Game {
    constructor() {
        // variables
        this.textureLoader = new THREE.TextureLoader()
        this.glbLoader = new GLTFLoader();
        this.clock = new THREE.Clock();

        // Setups
        this.initSceneAndRenderer()
        this.initBasicSetup()
        this.resize()
        this.createFloor()
        this.createSky()
        this.loadModel()

        // Mid
        // this.createShape()
        this.controlCharacter()

        // Render and animate()
        this.renderer.setAnimationLoop(this.animate.bind(this))
    }

    initSceneAndRenderer() {
        // Scene
        this.scene = new THREE.Scene()

        //Renderer: Size, pixelratio and shadowMap
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true

        document.body.appendChild(this.renderer.domElement)
    }

    initBasicSetup() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.set(0, 4, 10)
        this.scene.add(this.camera)

        // Light
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7))

        // Directional light for shadow and good light
        this.dirLight = new THREE.DirectionalLight(0xffffff, 1)
        this.dirLight.position.set(60, 70, -10)
        // Afaik when castShadow is enabled, three.js creates an internal hidden orthographic camera. the camera renders the scene from light's pov to generate shadow map
        // These are defining size of camera's area or shadow coverage area.
        this.dirLight.castShadow = true
        this.dirLight.shadow.camera.top = 50;
        this.dirLight.shadow.camera.bottom = -50;
        this.dirLight.shadow.camera.left = -50
        this.dirLight.shadow.camera.right = 50
        this.dirLight.shadow.camera.near = 0.1;
        this.dirLight.shadow.camera.far = 200;
        // It is like resolution the less the unclear..
        this.dirLight.shadow.mapSize.width = 4096;
        this.dirLight.shadow.mapSize.height = 4096;
        this.scene.add(this.dirLight)

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.minDistance = 5
        this.controls.maxDistance = 15
        this.controls.enablePan = false
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05

        // GridHelper
        // this.gridHelper = new THREE.GridHelper(100, 40)
        // this.scene.add(this.gridHelper)
    }

    createShape() {
        const geometry = new THREE.SphereGeometry(2)
        const material = new THREE.MeshStandardMaterial({ color: 0xF54927 })

        this.sphereMesh = new THREE.Mesh(geometry, material)
        this.sphereMesh.position.set(0, 2, 0)
        this.sphereMesh.traverse((object) => {
            object.castShadow = true
        })
        this.scene.add(this.sphereMesh)
    }

    loadModel() {
        this.glbLoader.load('./assets/modals/car1.glb', function (gltf) {
            this.carMesh = gltf.scene
            this.carMesh.traverse((object) => {
                if (object.isMesh) object.castShadow = true
            })
            this.carMesh.position.y = -0.2 // To avoid the airgap created by displacementScale(createFloor())

            // Other clips
            const idleClip = new THREE.AnimationClip("idle", 3, [])
            const turnClip = gltf.animations.find(a => a.name.includes('turn'))

            const leftClip = THREE.AnimationUtils.subclip(turnClip, "left_turn", 0, 40).resetDuration()
            const rightClip = THREE.AnimationUtils.subclip(turnClip, "right_turn", 50, 80)

            gltf.animations.push(idleClip)
            gltf.animations.push(leftClip)
            gltf.animations.push(rightClip)

            let allAnimations = gltf.animations
            let mixer = new THREE.AnimationMixer(this.carMesh)

            const animationsMap = new Map()
            allAnimations.forEach((a) => {
                let clipAction = mixer.clipAction(a)
                if (["left_turn", "right_turn"].includes(a.name)) {
                    // Don't loop and end with last frame
                    clipAction.setLoop(THREE.LoopOnce);
                    clipAction.clampWhenFinished = true;

                    // 3x the speed of left turn as it is slower
                    if (a.name == "left_turn") clipAction.timeScale = 3.0
                }
                animationsMap.set(a.name, clipAction)
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

    createFloor() {
        const wrapAndRepeatTexture = (map) => {
            map.wrapS = map.wrapT = THREE.RepeatWrapping
            map.repeat.x = map.repeat.y = 5
        }

        const sandBaseColor = this.textureLoader.load("./assets/textures/grass/Grass_COLOR.jpg") // Base color
        const sandNormalMap = this.textureLoader.load('./assets/textures/grass/Grass_NRM.jpg') // Fake 3d like effect
        const sendHeightMap = this.textureLoader.load("./assets/textures/grass/Grass_DISP.jpg") // Real height that can odify geometry
        const sandAmbientOcclusion = this.textureLoader.load("./assets/textures/grass/Grass_OCC.jpg") // Tells how much ambient light pixels must get(darker area means low and brighter means high)

        const WIDTH = 100;
        const LENGTH = 100;

        const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 10, 10) // segments to make disp work and deform I think..


        // Deforming the geometry
        const positionAttribute = geometry.attributes.position
        for(let i = 0; i < positionAttribute.count; i++){
            let x = positionAttribute.getX(i)
            let y = positionAttribute.getY(i)
            let z = positionAttribute.getZ(i)

            z += Math.random() * 2

            positionAttribute.setXYZ(i,x,y,z)
        }

        // Material and Texture
        const material = new THREE.MeshStandardMaterial({
            map: sandBaseColor,
            normalMap: sandNormalMap,
            displacementMap: sendHeightMap,
            displacementScale: 0.5,
            aoMap: sandAmbientOcclusion
        })
        wrapAndRepeatTexture(material.map)
        wrapAndRepeatTexture(material.normalMap)
        wrapAndRepeatTexture(material.displacementMap)
        wrapAndRepeatTexture(material.aoMap)

        this.floor = new THREE.Mesh(geometry, material)
        this.floor.receiveShadow = true
        this.floor.rotateX(deg2rad(90))
        material.side = THREE.DoubleSide
        this.scene.add(this.floor)
    }

    createSky() {
        const geometry = new THREE.SphereGeometry(50)
        const texture = this.textureLoader.load("./assets/textures/sky/sky_2k.jpg")
        const material = new THREE.MeshStandardMaterial({
            map: texture
        })
        material.side = THREE.DoubleSide
        this.sky = new THREE.Mesh(geometry, material)
        this.sky.position.y = -1
        this.scene.add(this.sky)
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