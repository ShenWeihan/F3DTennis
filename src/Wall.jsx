import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { RigidBodyType } from "@dimforge/rapier3d-compat";

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
  const timeoutRef = useRef();
  const [vector] = useState(() => new Vector3());

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
      const position = vec3(refMesh.current.translation());

      // const movement = vec3(refMesh.current.linvel() * delta);
      // controller.current.computeColliderMovement(collider.current, movement);

      // let correctedMovement = controller.current.computedMovement();
      // position.add(vec3(correctedMovement));
      position.add(vector.set(...offset));
      // correctedMovement.add(vec3(...offset));
      // console.log(position, offset);

      body.current.setNextKinematicTranslation(position);
    }
  });

  return (
    <RigidBody
      type="kinematicPosition"
      colliders={false}
      ref={body}
      {...rest}
      onContactForce={(evt) => {
        if (rest.onContactForce) rest.onContactForce(evt);
        body.current.setBodyType(RigidBodyType.Dynamic);
        clearTimeout(timeoutRef.current);
        setTimeout(() => {
          body.current.setBodyType(RigidBodyType.KinematicPositionBased);
        }, 200);
      }}
    >
      <CuboidCollider args={args} ref={collider} />
    </RigidBody>
  );
}
