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
        if (["w", "a", "s", "d"].some(key => keyPressed[key] == true)) {
            play = "driving"
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

        if (this.currentAction == "driving") {
            let moveX = 0;
            let moveZ = 0;
            if (keyPressed["w"]) { // W: Front
                moveZ -= this.driveVelocity * delta
                if (keyPressed["a"]) { // A * W: Front Left
                    moveX -= this.driveVelocity * delta
                } else if (keyPressed["d"]) { // D * W: Front Right
                    moveX += this.driveVelocity * delta
                }
            } else if (keyPressed["s"]) { // S: Back
                moveZ = this.driveVelocity * delta
                if (keyPressed["a"]) { // A * S: Back Left
                    moveX -= this.driveVelocity * delta
                } else if (keyPressed["d"]) { // D * S: Back Right
                    moveX += this.driveVelocity * delta
                }
            }
            this.model.position.z += moveZ
            this.model.position.x += moveX

            this.trackPlayer(moveX, moveZ)
        }
    }

    trackPlayer(x, z) {
        this.camera.position.x += x
        this.camera.position.z += z
        this.orbitControls.target = this.model.position
    }
}