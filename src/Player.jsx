import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRapier, RigidBody, useRevoluteJoint } from '@react-three/rapier'
import useGame from './stores/useGame.jsx'

export default function Player() {
    const body = useRef()
    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const rapierWorld = world.raw()
    const [smoothedCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10))
    const [smoothedCameraTarget] = useState(() => new THREE.Vector3())
    const start = useGame((state) => state.start)
    const end = useGame((state) => state.end)
    const restart = useGame((state) => state.restart)
    const blocksCount = useGame((state) => state.blocksCount)
    const baselineZ = 13

    const jump = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)

        if (hit.toi < 0.15) {
            body.current.applyImpulse({ x: 0, y: 500, z: 0 })
        }
    }

    const reset = () => {
        body.current.setTranslation({ x: 0, y: 1, z: baselineZ })
        body.current.setLinvel({ x: 0, y: 0, z: 0 })
        body.current.setAngvel({ x: 0, y: 0, z: 0 })
    }

    const shoulder = useRef()
    const arm = useRef()

    const jointShoulder = useRevoluteJoint(arm, shoulder, [
        // Position of the joint in arm's local space
        [-0.01, 0.25, 0],
        // Position of the joint in shoulder's local space
        [0.1, 0, 0],
        // Axis of the joint, expressed in the local-space of
        // the rigid-bodies it is attached to. Cannot be [0,0,0].
        [1, 0, 0]
    ])
    // const jointB = useRevoluteJoint(racquet, arm, [
    //     // Position of the joint in racquet's local space
    //     [-0.5, 0, 0],
    //     // Position of the joint in arm's local space
    //     [0, -0.4, 0],
    //     // Axis of the joint, expressed in the local-space of
    //     // the rigid-bodies it is attached to. Cannot be [0,0,0].
    //     [0, 1, 0]
    // ])


    useFrame((state, delta) => {
        /**
         * Controls
         */
        const { forward, backward, leftward, rightward, forehand, topspin } = getKeys()

        const impulse = { x: 0, y: 0, z: 0 }
        const torque = { x: 0, y: 0, z: 0 }

        const impulseStrength = 600 * delta
        const torqueStrength = 200 * delta

        if (forward) {
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if (rightward) {
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        if (backward) {
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if (leftward) {
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }

        body.current.applyImpulse(impulse)
        body.current.applyTorqueImpulse(torque)

        /**
         * Camera
         */
        const bodyPosition = body.current.translation()

        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(bodyPosition)
        cameraPosition.z += 4.25
        cameraPosition.y += 1.75

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)
        cameraTarget.z -= baselineZ
        cameraTarget.y += 0.5

        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)

        /**
         * Racquet
         */

        const margin = 0.01 + 0.3
        shoulder.current.setNextKinematicTranslation({
            x: bodyPosition.x + margin,
            y: bodyPosition.y + 0.75,
            z: bodyPosition.z
        })


        if (forehand) {

            arm.current.applyImpulse({ x: 0, y: 0, z: 10 })
        }
        if (topspin) {
            arm.current.applyImpulse({ x: 0, y: 0, z: -5 })

            // arm.current.setLinvel({ x: 0, y: 0, z: 0 })
            // arm.current.setAngvel({ x: 0, y: 0, z: 0 })
            // arm.current.applyImpulse({ x: 0, y: 0, z: -10 })
        }
        /**
        * Phases
        */
        if (bodyPosition.z < - (blocksCount * 4 + 2))
            end()

        if (bodyPosition.y < - 1)
            restart()
    })

    useEffect(() => {
        const unsubscribeReset = useGame.subscribe(
            (state) => state.phase,
            (value) => {
                if (value === 'ready')
                    reset()
            }
        )

        const unsubscribeJump = subscribeKeys(
            (state) => state.jump,
            (value) => {
                if (value)
                    jump()
            }
        )

        const unsubscribeAny = subscribeKeys(
            () => {
                start()
            }
        )

        return () => {
            unsubscribeReset()
            unsubscribeJump()
            unsubscribeAny()
        }
    }, [])

    return <>
        <RigidBody
            ref={body}
            colliders="ball"
            restitution={0.5}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 1, baselineZ]}
            density={997}
        >
            <mesh castShadow>
                <icosahedronGeometry args={[0.3, 1]} />
                <meshStandardMaterial flatShading color="mediumpurple" />
            </mesh>
        </RigidBody>
        <RigidBody
            type='kinematicPosition'
            ref={shoulder}
            restitution={0.7}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            density={997}
        >
            <mesh >
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshBasicMaterial flatShading color="yellow" />
            </mesh>
            <mesh
                position={[0.1, 0.2, 0]}
            >
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshBasicMaterial flatShading color="yellow" />
            </mesh>
        </RigidBody>
        <RigidBody
            ref={arm}
            position={[0.5, 0.1, -baselineZ]}
            restitution={1}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            density={997}
        >
            <mesh>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshBasicMaterial flatShading color="cyan" />
            </mesh>
            <mesh
                position={[0, -0.4, -0.2]}
                rotation={[1, 0, 0]}
            >
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshBasicMaterial flatShading color="cyan" />
            </mesh>
            <mesh
                position={[0.4, -0.5, -0.5]}
                rotation={[-0.2, 0, 0]}
            >
                <boxGeometry args={[0.75, 0.25, 0.04]} />
                <meshBasicMaterial flatShading color="#b4b4b4" />
            </mesh>
        </RigidBody>
    </>
}