import { useRef, useState, useEffect } from "react"
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useKeyboardControls } from "@react-three/drei"
import { useRapier, MeshCollider, RigidBody } from "@react-three/rapier"
import useGame from './stores/useGame.jsx'
import { useControls } from "leva"

export default function Ball({ props }) {
    const { nodes, materials } = useGLTF("/tennisball.glb")
    const body = useRef()

    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const rapierWorld = world.raw()

    const start = useGame((state) => state.start)
    const end = useGame((state) => state.end)
    const restart = useGame((state) => state.restart)
    const blocksCount = useGame((state) => state.blocksCount)

    const { baselineZ,
        linearDamping,
        angularDamping,
        startImpulseX,
        startImpulseY,
        startImpulseZ,
        TorqueImpulse,
        ballDensity,
    } = useControls({
        baselineZ: { value: 13, min: 0, max: 16 },
        linearDamping: { value: 0.2, min: 0, max: 1 },
        angularDamping: { value: 1, min: 0, max: 1 },
        startImpulseX: { value: 0, min: 0, max: 0.01 },
        startImpulseY: { value: 0.001, min: 0, max: 0.1 },
        startImpulseZ: { value: 0.002, min: 0, max: 0.1 },
        TorqueImpulse: { value: 0.2, min: -1, max: 1 },
        ballDensity: { value: 0.2, min: 0.01, max: 1 },
    })

    const serve = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)

        if (hit.toi < 0.15) {
            body.current.applyImpulse({ x: startImpulseX, y: startImpulseY, z: startImpulseZ })
            body.current.applyTorqueImpulse({ x: TorqueImpulse, y: 0, z: 0 })
        }
    }

    const reset = () => {
        body.current.setTranslation({ x: 0, y: 1, z: -baselineZ })
        body.current.setLinvel({ x: 0, y: 0, z: 0 })
        body.current.setAngvel({ x: 0, y: 0, z: 0 })
    }

    useEffect(() => {
        const unsubscribeReset = useGame.subscribe(
            (state) => state.phase,
            (value) => {
                if (value === 'ready')
                    reset()
            }
        )
        const unsubscribeServe = subscribeKeys(
            (state) => state.serve,
            (value) => {
                if (value)
                    serve()
            }
        )
        const unsubscribeAny = subscribeKeys(
            () => {
                start()
            }
        )

        return () => {
            unsubscribeReset()
            unsubscribeServe()
            unsubscribeAny()
        }
    }, [])

    const linearVelocity = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const nextAngularPosition = new THREE.Vector3()
    const angularVelocity = new THREE.Vector3()
    const [currPosition, setCurrPosition] = useState(new THREE.Vector3(0, 0, 0))
    const [currAngularPosition, setCurrAngularPosition] = useState(new THREE.Vector3(0, 0, 0))

    useFrame((state, delta) => {
        /**
         * Magnus effect
        */

        const nextPosition = body.current.nextTranslation()
        linearVelocity.set(nextPosition.x, nextPosition.y, nextPosition.z)
            .sub(currPosition)
            .multiplyScalar(1 / delta)
        setCurrPosition(nextPosition)

        const r = body.current.nextRotation()
        quaternion.set(r.x, r.y, r.z, r.w)
        euler.setFromQuaternion(quaternion)

        nextAngularPosition.setFromEuler(euler)
        setCurrAngularPosition(nextAngularPosition)

        angularVelocity.subVectors(nextAngularPosition, currAngularPosition)
            .multiplyScalar(1 / delta)

        // Magnus effect
        angularVelocity.cross(linearVelocity).multiplyScalar(angularDamping * 0.001)
        const force = { x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z }

        console.log(force)

        // body.current.addForce(force)

        /**
        * Phases
        */
        const bodyPosition = body.current.translation()
        if (bodyPosition.z < - (blocksCount * 4 + 2))
            end()

        if (bodyPosition.y < - 4)
            restart()
    })

    return (<RigidBody
        ref={body}
        ccd
        colliders={false}
        position={[0, 2, -baselineZ]}
        restitution={0.5}
        friction={0.5}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        density={ballDensity}
    >
        {/* <BallCollider /> */}
        <group {...props} dispose={null}
            scale={0.065}
        >
            <MeshCollider type='ball'>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Sphere.geometry}
                    material={materials["Material.001"]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            </MeshCollider>

            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Sphere001.geometry}
                material={materials.Material}
                rotation={[Math.PI / 2, 0, 0]}
            />
        </group>
    </RigidBody>
    )
}

useGLTF.preload("/tennisball.glb")
