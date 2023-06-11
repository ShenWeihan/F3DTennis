import { RigidBody } from "@react-three/rapier"
import Net from "./Net"
import { useControls } from "leva"

import { shaderMaterial } from "@react-three/drei"
import courtVertexShader from './shaders/courtVertexShader.glsl'
import courtFragmentShader from './shaders/courtFragmentShader.glsl'
import { Color } from "three"
import { extend } from "@react-three/fiber"
const CourtMaterial = shaderMaterial(
    {
        innerColor: new Color("#73C8E4"),
        outterColor: new Color("#5F7795"),
    },
    courtVertexShader,
    courtFragmentShader
)
extend({ CourtMaterial })



export default function Court() {
    // Foot to meter
    const foot2Meter = (num) => (num * 0.3048).toFixed(2)
    const linewidth = foot2Meter(2 / 12)
    const { courtFriction,
        courtRestitution,
        innerColor,
        outterColor } = useControls({
            courtFriction: 0.25,
            courtRestitution: 0.75,
            innerColor: "#5F7795",
            outterColor: "#73C8E4",
        })

    return <>
        {/* <mesh position={[0, 2, 1]}>
            <planeGeometry args={[3, 3]} />
            <courtMaterial innerColor={innerColor} outterColor={outterColor} />
        </mesh> */}
        <Net colider
            rotation-y={-Math.PI / 2} scale={[0.8, 0.8, 0.8]} />
        {/* No man's land */}
        <RigidBody
            type='fixed'
            friction={courtFriction}
            restitution={courtRestitution}
        >
            <mesh position-y={-0.253}>
                <boxGeometry args={[foot2Meter(36 + 12 * 2), 0.5, foot2Meter(78 + 21 * 2)]} />
                <meshStandardMaterial color={outterColor} />
            </mesh>
        </RigidBody>
        {/* Court */}
        <mesh
            position-y={-0.001}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[foot2Meter(36), foot2Meter(78)]} />
            <meshStandardMaterial color={innerColor} />
        </mesh>
        {/* Side line */}
        <mesh
            position-x={(foot2Meter(36) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, foot2Meter(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-x={-(foot2Meter(36) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, foot2Meter(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Alley line */}
        <mesh
            position-x={(foot2Meter(36 - 9) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, foot2Meter(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-x={-(foot2Meter(36 - 9) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, foot2Meter(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Baseline */}
        <mesh
            position-z={(foot2Meter(78) - 2 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[foot2Meter(36), 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(foot2Meter(78) - 2 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[foot2Meter(36), 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Service line */}
        <mesh
            position-z={(foot2Meter(78 - 18 * 2) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[foot2Meter(27), linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(foot2Meter(78 - 18 * 2) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[foot2Meter(27), linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Center service line */}
        <mesh
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, foot2Meter(78 - 18 - 18)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Center mark */}
        <mesh
            position-z={(foot2Meter(78) - 6 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(foot2Meter(78) - 6 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
    </>
}