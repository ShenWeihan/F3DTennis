import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import "./styles.scss";
import {
    RigidBody,
    useRapier,
    vec3,
    CuboidCollider
} from "@react-three/rapier";

export function Wall({ refMesh }) {
    const rapier = useRapier();
    const controller = useRef();
    const collider = useRef(null);
    const body = useRef(null);

    useEffect(() => {
        const rawWorld = rapier.world.raw()
        const c = rawWorld.createCharacterController(0.1);
        c.setApplyImpulsesToDynamicBodies(true);
        c.setCharacterMass(0.2);
        c.enableSnapToGround(0.02);

        controller.current = c;

        return () => {
            if (controller.current)
                rawWorld.removeCharacterController(controller.current)
        }
    }, [rapier]);

    useFrame((context, delta) => {
        if (controller.current && body.current && collider.current && refMesh.current) {
            try {
                const { velocity } = refState.current;

                const position = vec3(body.current.translation());
                const movement = vec3(refMesh.current.translation());

                controller.current.computeColliderMovement(collider.current, movement);
                refState.current.grounded = controller.current.computedGrounded();

                let correctedMovement = controller.current.computedMovement();
                position.add(vec3(correctedMovement));

                body.current.setNextKinematicTranslation(position);
            } catch (err) { }
        }
    });

    return (
        <RigidBody
            type="kinematicPosition"
            colliders={false}
            ref={body}
            position={[0, 10, 0]}
        >
            <CuboidCollider args={[0.5, 1.5, 0.5]} ref={collider} />
        </RigidBody>
    );
};
