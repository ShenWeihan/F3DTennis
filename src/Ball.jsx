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
        startImpulseX: { value: -1e-3, min: -1e-2, max: 1e-2 },
        startImpulseY: { value: 2.5e-3, min: -1e-2, max: 1e-2 },
        startImpulseZ: { value: 3e-3, min: -1e-2, max: 1e-2 },
        TorqueImpulse: { value: 1.5e-4, min: -2e-4, max: 2e-4 },
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
            body.current.applyTorqueImpulse({ x: 0, y: TorqueImpulse, z: 0 })
        }
    }

    const reset = () => {
        body.current.resetForces()
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

    function crossVectors(a, b, coeff = 1) {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        const res = {
            x: (ay * bz - az * by) * coeff,
            y: (az * bx - ax * bz) * coeff,
            z: (ax * by - ay * bx) * coeff,
        }
        return res
    }
    useFrame((state, delta) => {
        /**
        * Magnus effect
        */
        const linvel = body.current.linvel()
        const angvel = body.current.angvel()
        const force = crossVectors(angvel, linvel, 1e-8)
        body.current.addForce(force)
        console.log(force)

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
        friction={0.25}
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
