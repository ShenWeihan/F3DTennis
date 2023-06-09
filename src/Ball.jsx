import { useRef, useEffect } from "react"
import { useFrame } from '@react-three/fiber'
import { Trail, useGLTF, useKeyboardControls } from "@react-three/drei"
import { useRapier, MeshCollider, RigidBody } from "@react-three/rapier"
import useGame from './stores/useGame.jsx'
import { useControls } from "leva"

export default function Ball({ props, magnus = true }) {



    const { nodes, materials } = useGLTF("/tennisball.glb")
    const body = useRef()

    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const rapierWorld = world.raw()

    const start = useGame((state) => state.start)
    const end = useGame((state) => state.end)
    const restart = useGame((state) => state.restart)


    const { baselineZ,
        linearDamping,
        angularDamping,
        serveMPHX,
        serveMPHY,
        serveMPHZ,
        serveRPM,
        ballDensity,
    } = useControls({
        baselineZ: { value: 13, min: 0, max: 16 },
        linearDamping: { value: 0.5, min: 0, max: 10 },
        angularDamping: { value: 1, min: 0, max: 10 },
        serveMPHX: { value: -2, min: -5, max: 5 },
        serveMPHY: { value: 18, min: 0, max: 30 },
        serveMPHZ: { value: 50, min: -140, max: 140 },
        serveRPM: { value: 1000, min: -2000, max: 2000 },
        ballDensity: { value: 0.2, min: 0.01, max: 1 },
    })
    const rpm2Rads = (v) => v * 0.1047198
    const mph2ms = (v) => v * 0.44704
    /**
 * Real constants
 */
    const mass = 0.058
    const diameter = 0.066
    const contactDuration = 5e-3
    const restitution = 0.75
    const airCoeff = 5e-8
    const serve = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)

        if (hit?.toi < 0.15)
            body.current.applyImpulse({
                x: mph2ms(serveMPHX) * mass * contactDuration,
                y: mph2ms(serveMPHY) * mass * contactDuration,
                z: mph2ms(serveMPHZ) * mass * contactDuration,
            })
        const torqueImpulst = -mass * rpm2Rads(serveRPM) * diameter / 2 * contactDuration
        body.current.applyTorqueImpulse({
            x: -torqueImpulst * Math.cos(Math.PI / 6),
            y: 0,
            z: torqueImpulst * Math.sin(Math.PI / 6),
        })
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
        if (magnus) {
            const linvel = body.current.linvel()
            const angvel = body.current.angvel()
            const force = crossVectors(angvel, linvel, airCoeff)
            body.current.resetForces(true)
            body.current.addForce(force)
        }

        /**
        * Phases
        */
        const bodyPosition = body.current.translation()
        if (bodyPosition.y < - 2)
            restart()
    })

    return (<RigidBody
        ref={body}
        ccd
        colliders={false}
        position={[0, 2, -baselineZ]}
        restitution={restitution}
        friction={0.25}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        density={ballDensity}
        mass={mass}
    >

        <Trail
            width={1} // Width of the line
            color={'hotpink'} // Color of the line
            length={20} // Length of the line
            decay={1} // How fast the line fades away
            local={false} // Wether to use the target's world or local positions
            stride={0} // Min distance between previous and current point
        // attenuation={(width) => width} // A function to define the width in each point along it.
        >

            {/* <BallCollider /> */}
            <group {...props} dispose={null}
                scale={diameter}
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
        </Trail>
    </RigidBody>
    )
}

useGLTF.preload("/tennisball.glb")
