import { Vector3 } from "../../three/build/three.core.js"
import { A, D, S, W } from "./utils.js"

//!!!!!!!!!!!!!!!!!!!@Currently keeping left and right same as front and back but in future make it turns(rotations!)!!!!!!!!!!!!!!!!!!!!!!
export class CharacterControls {
    constructor(model, mixer, animationsMap, orbitControls, camera, currentAction) {
        this.driveVelocity = 5

        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.orbitControls = orbitControls
        this.camera = camera
        this.currentAction = currentAction

        // Initial State
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) value.play()
        })
    }

    update(delta, keyPressed) {
        this.mixer.update(delta);

        let play;

        if ([W, A, S, D].some(key => keyPressed[key] == true)) { // WASD
            // Driving or turning

            if ([A, D].some(key => keyPressed[key] == true)) {
                // Only Turning
                play = keyPressed[A] ? "left_turn" : "right_turn"

            } else {
                // Driving front or back only
                // play = "driving"
                play = "driving"
            }
        } else {
            play = "idle"
        }

        // must be different that prev action
        if (this.currentAction != play) {
            let current = this.animationsMap.get(this.currentAction)
            let toPlay = this.animationsMap.get(play)

            current.fadeOut(0.2)
            toPlay.reset().fadeIn(0.2).play()

            this.currentAction = play
        }


        if (this.currentAction.includes("turn")) {
            this.model.rotateY(this.currentAction.includes("left") ? 0.01 : -0.01)
        }

        if (this.currentAction == "driving") {
            const speed = this.driveVelocity * delta
            const move = keyPressed["w"] ? -speed : speed

            this.model.translateZ(move)

            this.trackPlayer(move)
        }
    }

    trackPlayer(move) {
        this.camera.position.z += move
        this.orbitControls.target = this.model.position
    }
}