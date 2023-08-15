import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";

import {
  RigidBody,
  useRapier,
  vec3,
  CuboidCollider,
} from "@react-three/rapier";

export function Wall({ refMesh, args, offset, ...rest }) {
  const rapier = useRapier();
  const controller = useRef();
  const collider = useRef(null);
  const body = useRef(null);
  const [vec] = useState(() => new Vector3());

  useEffect(() => {
    const rawWorld = rapier.world.raw();
    const c = rawWorld.createCharacterController(0.1);
    c.setApplyImpulsesToDynamicBodies(true);
    c.setCharacterMass(0.2);
    c.enableSnapToGround(0.02);

    controller.current = c;

    return () => {
      if (controller.current)
        rawWorld.removeCharacterController(controller.current);
    };
  }, [rapier]);

  useFrame((context, delta) => {
    if (
      controller.current &&
      body.current &&
      collider.current &&
      refMesh.current
    ) {
      const position = vec3(body.current.translation());

      const movement = vec3(refMesh.current.linvel() * delta);
      controller.current.computeColliderMovement(collider.current, movement);

      let correctedMovement = controller.current.computedMovement();
      position.add(vec3(correctedMovement));
      position.add(vec.set(...offset));
      // correctedMovement.add(vec3(...offset));
      // console.log(position, offset);

      body.current.setNextKinematicTranslation(position);
    }
  });

  return (
    <RigidBody type="kinematicPosition" colliders={false} ref={body} {...rest}>
      <CuboidCollider args={args} ref={collider} />
    </RigidBody>
  );
}
