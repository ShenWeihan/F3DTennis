import { useRef, useEffect } from "react"
import { Trail, useGLTF, useKeyboardControls } from "@react-three/drei"
import { useRapier, BallCollider, RigidBody, useBeforePhysicsStep } from "@react-three/rapier"
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

    const {
        baselineZ,
        linearDamping,
        angularDamping,
        serveMPHX,
        serveMPHY,
        serveMPHZ,
        serveRPM,
    } = useControls({
        baselineZ: { value: 13, min: 0, max: 16 },
        linearDamping: { value: 0.5, min: 0, max: 10 },
        angularDamping: { value: 0.5, min: 0, max: 10 },
        serveMPHX: { value: -2, min: -5, max: 5 },
        serveMPHY: { value: 10, min: 0, max: 30 },
        serveMPHZ: { value: 60, min: -140, max: 140 },
        serveRPM: { value: 1800, min: -2000, max: 2000 },
    })
    const rpm2Rads = (v) => v * 2 * Math.PI / 60
    const mph2ms = (v) => v * 0.44704
    /**
     * Real constants
     */
    const mass = 0.058
    const diameter = 0.067
    const restitution = 0.75
    const Cd = 2 / 3 * 1.2 * Math.pow(diameter / 2, 3)

    const serve = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)
        if (hit?.toi < 0.15) {
            body.current.setLinvel({
                x: mph2ms(serveMPHX),
                y: mph2ms(serveMPHY),
                z: mph2ms(serveMPHZ),
            }, true)
            const angvel = {
                x: -rpm2Rads(serveRPM) * Math.cos(Math.PI / 6),
                y: rpm2Rads(serveRPM) * Math.sin(Math.PI / 6),
                z: 0,
            }
            body.current.setAngvel(angvel, true)
        }
    }
    const reset = () => {
        body.current.resetForces()
        body.current.setTranslation({ x: 0, y: 0, z: -baselineZ })
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
    useBeforePhysicsStep(() => {
        /**
        * Magnus effect
        */
        if (magnus) {
            const linvel = body.current.linvel()
            const angvel = body.current.angvel()
            const force = crossVectors(angvel, linvel, Cd)
            body.current.resetForces(true)
            body.current.addForce(force)
        }
    })

    const centerOfMass = { x: 0, y: 0, z: 0 }
    const angine = 2 / 3 * mass * Math.pow(diameter / 2, 2)
    const principalAngularInertia = { x: angine, y: angine, z: angine }
    const angularInertiaLocalFrame = { w: 1, x: 1, y: 1, z: 1 }
    const massProperties = [mass, centerOfMass, principalAngularInertia, angularInertiaLocalFrame]
    return (<Trail
        width={0.6} // Width of the line
        color={'hotpink'} // Color of the line
        length={15} // Length of the line
        decay={2} // How fast the line fades away
    >
        <RigidBody
            name='tennisball'
            ref={body}
            ccd
            colliders={false}
            position={[0, 0, -baselineZ]}
            restitution={restitution}
            friction={0.25}
            linearDamping={linearDamping}
            angularDamping={angularDamping}
            density={mass / (4 / 3 * Math.PI * Math.pow(diameter / 2, 3))}
        // massProperties={[mass, { x: 0, y: 0, z: 0 },]}
        >
            <BallCollider args={[diameter / 2]} />
            <group {...props} dispose={null}
                scale={diameter / 2}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Sphere.geometry}
                    material={materials["Material.001"]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Sphere001.geometry}
                    material={materials.Material}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            </group>
        </RigidBody>
    </Trail>
    )
}

useGLTF.preload("/tennisball.glb")
