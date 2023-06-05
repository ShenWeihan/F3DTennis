import { useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { BallCollider, MeshCollider, RigidBody } from "@react-three/rapier"

export default function Ball({ props }) {
    const { nodes, materials } = useGLTF("/tennisball.glb")
    const ref = useRef()
    

    return (<RigidBody
        ref={ref}
        colliders={false}
        position={[0, 2, -10]}
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
