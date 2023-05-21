
import { RigidBody } from "@react-three/rapier"

export default function Court() {
    // Foot to meter
    const f2m = (num) => (num * 0.3048).toFixed(2)
    const linewidth = f2m(2 / 12)
    const lineheight = 0.1
    return <>
        {/* No man's land */}
        <RigidBody type='fixed'>
            <mesh position-y={-0.253}>
                <boxGeometry args={[f2m(36 + 12 * 2), 0.5, f2m(78 + 21 * 2)]} />
                <meshStandardMaterial color='#73C8E4' />
            </mesh>
        </RigidBody>
        {/* Court */}
        <mesh
            position-y={-0.001}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[f2m(36), f2m(78)]} />
            <meshStandardMaterial color='#5F7795' />
        </mesh>
        {/* Side line */}
        <mesh
            position-x={(f2m(36) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, f2m(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-x={-(f2m(36) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, f2m(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Alley line */}
        <mesh
            position-x={(f2m(36 - 9) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, f2m(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-x={-(f2m(36 - 9) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, f2m(78)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Baseline */}
        <mesh
            position-z={(f2m(78) - 2 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[f2m(36), 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(f2m(78) - 2 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[f2m(36), 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Service line */}
        <mesh
            position-z={(f2m(78 - 18 * 2) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[f2m(27), linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(f2m(78 - 18 * 2) - linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[f2m(27), linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Center service line */}
        <mesh
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, f2m(78 - 18 - 18)]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        {/* Center mark */}
        <mesh
            position-z={(f2m(78) - 6 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
        <mesh
            position-z={-(f2m(78) - 6 * linewidth) / 2}
            rotation-x={-Math.PI / 2}
        >
            <planeGeometry args={[linewidth, 2 * linewidth]} />
            <meshStandardMaterial color='#ffffff' />
        </mesh>
    </>
}