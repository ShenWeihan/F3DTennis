import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { editable as e } from '@theatre/r3f'

export function TheatreJsMixamoRig({ nodes }) {
    const bones = {}
    for (const key in nodes) {
        if (key.startsWith('mixamorig')) {
            bones[key] = { ...nodes[key], ref: useRef() };
        }
    }
    useFrame(() => {
        for (const key in bones) {
            if (bones[key].ref.current) {
                nodes[key].rotation.copy(bones[key].ref.current.rotation)
            }
        }
    })
    return (<>
        {Object.entries(bones).map(([key, bone]) => <e.group theatreKey={key} key={key} ref={bone.ref} position={bone.position} rotation={bone.rotation} />)}
    </>)
}