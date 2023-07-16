import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshDiscardMaterial, useKeyboardControls } from '@react-three/drei'
import { useRapier, RigidBody, useRevoluteJoint, useSphericalJoint } from '@react-three/rapier'
import useGame from './stores/useGame.jsx'

export default function Player() {
    const legsRef = useRef()
    const hipRef = useRef()
    const torsoRef = useRef()
    const shldrRARef = useRef()
    const shldrRBRef = useRef()
    const shldrLARef = useRef()
    const shldrLBRef = useRef()
    const leftshldrRef = useRef()
    const armRRef = useRef()
    const armLRef = useRef()
    const headRef = useRef()

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
        const origin = legsRef.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)

        if (hit.toi < 0.15) {
            legsRef.current.applyImpulse({ x: 0, y: 200, z: 0 }, true)
        }
    }

    const reset = () => {
        legsRef.current.setTranslation({ x: 0, y: 1, z: baselineZ })
        legsRef.current.setLinvel({ x: 0, y: 0, z: 0 })
        legsRef.current.setAngvel({ x: 0, y: 0, z: 0 })
    }
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
        const unsubscribeDrag = subscribeKeys(
            (state) => state.topspin && state.forward,
            (value) => {
                if (value)
                    console.log('Dragging')
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

    const jointTorsoRef = useRevoluteJoint(hipRef, torsoRef, [
        // Position of the joint in hip's local space
        [0, 0.1, 0],
        // Position of the joint in torso's local space
        [0, -0.1, 0],
        // Axis of the joint, expressed in the local-space of
        // the rigid-bodies it is attached to. Cannot be [0,0,0].
        [0, 1, 0]
    ])

    // Right Shoulder Lateral Rotation
    const jointRightSLRRef = useRevoluteJoint(torsoRef, shldrRARef, [
        [0.4, 0.2, 0],
        [0, 0, 0],
        [1, 0, 0]
    ])
    // Right Shoulder Front Rotation
    const jointRightSFRRef = useRevoluteJoint(shldrRARef, shldrRBRef, [
        [0, 0, 0],
        [0, 0, 0],
        [1, 0, 0]
    ])
    // Right Shoulder Internal Rotation
    const jointRightSIRRef = useRevoluteJoint(shldrRBRef, armRRef, [
        // Position of the joint in shldrRBRef's local space
        [0, 0, 0],
        // Position of the joint in armRRef's local space
        [0, 0.6, 0],
        [0, 1, 0]
    ])
    // Left Shoulder Lateral Rotation
    const jointLeftSLRRef = useRevoluteJoint(torsoRef, shldrLARef, [
        [-0.4, 0.2, 0],
        [0, 0, 0],
        [1, 0, 0]
    ])
    // Left Shoulder Front Rotation
    const jointLeftSFRRef = useRevoluteJoint(shldrLARef, shldrLBRef, [
        [0, 0, 0],
        [0, 0, 0],
        [1, 0, 0]
    ])
    // Left Shoulder Internal Rotation
    const jointLeftSIRRef = useRevoluteJoint(shldrLBRef, armLRef, [
        // Position of the joint in shldrRBRef's local space
        [0, 0, 0],
        // Position of the joint in armRRef's local space
        [0, 0.6, 0],
        [0, 1, 0]
    ])

    useFrame((state, delta) => {

        /**
         * Controls
        */
        const { forward, backward, leftward, rightward, forehand, topspin, chop } = getKeys()


        // Legs
        if (legsRef.current) {
            const impulse = { x: 0, y: 0, z: 0 }
            const torque = { x: 0, y: 0, z: 0 }

            const impulseStrength = (chop ? 200 : 300) * delta
            const torqueStrength = (chop ? 200 : 300) * delta
            if (chop) {
                const breakImpulse = legsRef.current.linvel()
                legsRef.current.applyImpulse({
                    x: -breakImpulse.x * 500 * delta,
                    y: -breakImpulse.y * 500 * delta,
                    z: -breakImpulse.z * 500 * delta,
                }, true)
            }
            if (forward && !topspin) {
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

            legsRef.current.applyImpulse(impulse, true)
            legsRef.current.applyTorqueImpulse(torque, true)
        }

        /**
         * Hip
         */
        const hipPosition = legsRef.current.translation()
        if (hipRef.current) {
            hipRef.current.setNextKinematicTranslation({
                x: hipPosition.x,
                y: hipPosition.y + 0.6,
                z: hipPosition.z,
            })
        }
        /**
         * Torso
         */
        if (torsoRef.current) torsoRef.current.wakeUp() // keep torso awake
        if (jointTorsoRef.current) {
            if (forehand) {
                jointTorsoRef.current.configureMotorPosition(-Math.PI / 4, 100, 10)
                jointRightSFRRef.current.configureMotorPosition(Math.PI / 2, 100, 1)
            }
            else if (topspin) {
                jointTorsoRef.current.configureMotorPosition(Math.PI / 10, 100, 10)
                jointRightSIRRef.current.configureMotorVelocity(10, 1)
            }
            else {
                jointTorsoRef.current.configureMotorPosition(0, 100, 10)
            }
        }
        /**
         * Arms
         */
        if (jointRightSIRRef.current) {
            jointRightSFRRef.current.configureMotorPosition(0, 1000000, 1000)
            jointRightSLRRef.current.configureMotorPosition(0, 1000000, 1000)
            jointRightSIRRef.current.configureMotorPosition(0, 10000, 1000)
        }
        if (jointLeftSIRRef.current) {
            jointLeftSLRRef.current.configureMotorPosition(0, 1000000, 1000)
            jointLeftSFRRef.current.configureMotorPosition(0, 1000000, 1000)
            jointLeftSIRRef.current.configureMotorPosition(0, 10000, 1000)
        }
        /**
         * Head
         */
        if (headRef.current)
            headRef.current.setNextKinematicTranslation({
                x: hipPosition.x,
                y: hipPosition.y + 1.3,
                z: hipPosition.z,
            })

        /**
         * Camera
         */

        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(hipPosition)
        cameraPosition.z += 4.25
        cameraPosition.y += 1.75

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(hipPosition)
        cameraTarget.z -= baselineZ
        cameraTarget.y += 0.5

        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)

        /**
        * Phase
        */
        if (hipPosition.z < - (blocksCount * 4 + 2))
            end()

        if (hipPosition.y < - 1)
            restart()
    })

    return <>
        <RigidBody ref={legsRef}
            colliders="ball"
            restitution={0.5}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 1, baselineZ]}
            density={300}
        >
            <mesh castShadow>
                <icosahedronGeometry args={[0.4, 1]} />
                <meshStandardMaterial flatShading color="mediumpurple" />
            </mesh>
        </RigidBody>
        <RigidBody ref={hipRef}
            type='kinematicPosition'
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
        >
            <mesh>
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={torsoRef}
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
            position={[0, 2, baselineZ]}
        >
            <mesh>
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
            <mesh
                position={[0, 0.2, 0]}
            >
                <boxGeometry args={[0.6, 0.2, 0.3]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={shldrRARef}
            colliders="hull"
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
        >
            <mesh>
                <sphereGeometry args={[0.08, 10, 10, 0, -Math.PI, 0, Math.PI]} />
                <meshBasicMaterial color='gray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={shldrRBRef}
            colliders="hull"
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
        >
            <mesh>
                <sphereGeometry args={[0.08, 10, 10, 0, Math.PI, 0, Math.PI]} />
                <meshBasicMaterial color='gray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={armRRef}
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
            position={[0, 2, 0]}
        >
            <mesh>
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={shldrLARef}
            colliders="hull"
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
        >
            <mesh>
                <sphereGeometry args={[0.08, 10, 10, 0, -Math.PI, 0, Math.PI]} />
                <meshBasicMaterial color='gray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={shldrLBRef}
            colliders="hull"
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
        >
            <mesh>
                <sphereGeometry args={[0.08, 10, 10, 0, Math.PI, 0, Math.PI]} />
                <meshBasicMaterial color='gray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={armLRef}
            restitution={0}
            friction={0}
            linearDamping={0}
            angularDamping={0}
            density={997}
            position={[0, 2, 0]}
        >
            <mesh>
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
            <mesh
                position={[0, 0.4, 0]}
            >
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <meshBasicMaterial color='lightgray' />
            </mesh>
        </RigidBody>
        <RigidBody ref={headRef}
            type='kinematicPosition'
            colliders="ball"
            restitution={0.5}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 1, baselineZ]}
            density={997}
        >
            <mesh scale={[1, 1.2, 1]} castShadow>
                <icosahedronGeometry args={[0.13, 1]} />
                <meshStandardMaterial flatShading color="darkgray" />
            </mesh>
        </RigidBody>

    </>
}