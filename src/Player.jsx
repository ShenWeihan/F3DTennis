import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshDiscardMaterial, useKeyboardControls } from "@react-three/drei";
import {
  useRapier,
  RigidBody,
  useRevoluteJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import useGame from "./stores/useGame.jsx";
import { Wall } from "./Wall";

export default function Player() {
  const legsRef = useRef();
  const hipRef = useRef();
  const torsoRef = useRef();
  const shldrRARef = useRef();
  const shldrRBRef = useRef();
  const shldrLARef = useRef();
  const shldrLBRef = useRef();
  const leftshldrRef = useRef();
  const armRRef = useRef();
  const armLRef = useRef();
  const headRef = useRef();
  const timeoutRef = useRef();
  /**
   * Joints
   */
  const jointTorsoRef = useRevoluteJoint(hipRef, torsoRef, [
    [0, 0.1, 0],
    [0, -0.1, 0],
    [0, 1, 0],
  ]);

  // Right Shoulder Front Rotation
  const jointRightSFRRef = useRevoluteJoint(torsoRef, shldrRARef, [
    [0.4, 0.2, 0],
    [0, 0, 0],
    [1, 0, 0],
  ]);
  // Right Shoulder Lateral Rotation
  const jointRightSLRRef = useRevoluteJoint(shldrRARef, shldrRBRef, [
    [0, 0, 0.001],
    [0, 0, -0.001],
    [0, 0, 1],
  ]);
  // Right Shoulder Internal Rotation
  const jointRightSIRRef = useRevoluteJoint(shldrRBRef, armRRef, [
    [0, -0.1, 0],
    [0, 0.5, 0],
    [0, 1, 0],
  ]);
  // Left Shoulder Front Rotation
  const jointLeftSFRRef = useRevoluteJoint(torsoRef, shldrLARef, [
    [-0.4, 0.2, 0],
    [0, 0, 0],
    [1, 0, 0],
  ]);
  // Left Shoulder Lateral Rotation
  const jointLeftSLRRef = useRevoluteJoint(shldrLARef, shldrLBRef, [
    [0, 0, 0.001],
    [0, 0, -0.001],
    [0, 0, 1],
  ]);
  // Left Shoulder Internal Rotation
  const jointLeftSIRRef = useRevoluteJoint(shldrLBRef, armLRef, [
    [0, -0.1, 0],
    [0, 0.5, 0],
    [0, 1, 0],
  ]);

  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { rapier, world } = useRapier();
  const rapierWorld = world.raw();
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(10, 10, 10)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());
  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const blocksCount = useGame((state) => state.blocksCount);
  const baselineZ = 13;

  const jump = () => {
    const origin = legsRef.current.translation();
    origin.y -= 0.31;
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = rapierWorld.castRay(ray, 10, true);

    if (hit.toi < 0.15) {
      legsRef.current.applyImpulse({ x: 0, y: 200, z: 0 }, true);
    }
  };

  const reset = () => {
    legsRef.current.setTranslation({ x: 0, y: 1, z: baselineZ });
    legsRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    legsRef.current.setAngvel({ x: 0, y: 0, z: 0 });
  };

  useEffect(() => {
    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (value) => {
        if (value === "ready") reset();
      }
    );

    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value) jump();
      }
    );
    const unsubscribeDrag = subscribeKeys(
      (state) => state.topspin && state.forward,
      (value) => {
        if (value) {
          // console.log('Dragging')
        }
      }
    );

    const unsubscribeAny = subscribeKeys(() => {
      start();
    });

    return () => {
      unsubscribeReset();
      unsubscribeJump();
      unsubscribeAny();
    };
  }, []);

  useFrame((state, delta) => {
    const {
      forward,
      backward,
      leftward,
      rightward,
      forehand,
      backhand,
      topspin,
      slice,
      chop,
    } = getKeys();
    /**
     * Legs
     */
    if (legsRef.current) {
      const impulse = { x: 0, y: 0, z: 0 };
      const torque = { x: 0, y: 0, z: 0 };

      const impulseStrength = (chop ? 200 : 400) * delta;
      const torqueStrength = (chop ? 200 : 400) * delta;
      if (chop) {
        const breakImpulse = legsRef.current.linvel();
        legsRef.current.applyImpulse(
          {
            x: -breakImpulse.x * 500 * delta,
            y: -breakImpulse.y * 500 * delta,
            z: -breakImpulse.z * 500 * delta,
          },
          true
        );
      }
      if (forward && !topspin) {
        impulse.z -= impulseStrength;
        torque.x -= torqueStrength;
      }
      if (rightward) {
        impulse.x += impulseStrength;
        torque.z -= torqueStrength;
      }

      if (backward) {
        impulse.z += impulseStrength;
        torque.x += torqueStrength;
      }

      if (leftward) {
        impulse.x -= impulseStrength;
        torque.z += torqueStrength;
      }

      legsRef.current.applyImpulse(impulse, true);
      legsRef.current.applyTorqueImpulse(torque, true);
    }
    /**
     * Hip
     */
    const hipPosition = legsRef.current.translation();
    if (hipRef.current) {
      hipRef.current.setNextKinematicTranslation({
        x: hipPosition.x,
        y: hipPosition.y + 0.6,
        z: hipPosition.z,
      });
    }
    /**
     * Torso
     */
    if (torsoRef.current) torsoRef.current.wakeUp(); // keep torso awake
    if (jointTorsoRef.current) {
      if (forehand) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () =>
            jointTorsoRef.current.configureMotorPosition(-Math.PI / 4, 250, 10),
          10
        );

        if (slice) {
          jointTorsoRef.current.configureMotorPosition(-Math.PI / 10, 250, 10);
        }
      } else if (topspin) {
        jointTorsoRef.current.configureMotorPosition(Math.PI / 10, 250, 10);
      } else if (backhand) {
        jointTorsoRef.current.configureMotorPosition(Math.PI / 3, 250, 10);
        if (topspin) {
          jointTorsoRef.current.configureMotorPosition(Math.PI / 4, 250, 10);
        }
        if (slice) {
          jointTorsoRef.current.configureMotorPosition(Math.PI / 6, 250, 10);
        }
      } else {
        jointTorsoRef.current.configureMotorPosition(0, 100, 10);
      }
    }

    /**
     * Right Arm
     */
    if (jointRightSFRRef.current) {
      const armRPosition = armRRef.current.translation();
      if (forehand) {
        // jointRightSLRRef.current.configureMotorPosition(Math.PI / 8, 1e5, 1e3)
        armRRef.current.applyImpulseAtPoint(
          { x: 5 * delta, y: 20 * delta, z: 10 * delta },
          armRPosition,
          true
        );
        if (topspin) {
          // jointRightSFRRef.current.configureMotorPosition(Math.PI / 5, 1e5, 1e3)
          armRRef.current.applyImpulseAtPoint(
            { x: 0 * delta, y: 0 * delta, z: 0 * delta },
            armRPosition,
            true
          );
        }
        if (slice) {
        }
      } else if (topspin) {
        // jointRightSFRRef.current.configureMotorPosition(Math.PI / 5, 1e5, 1e3)
        armRRef.current.applyImpulseAtPoint(
          { x: 0 * delta, y: 10 * delta, z: 0 * delta },
          armRPosition,
          true
        );
      } else if (backhand) {
        if (topspin) {
        }
        if (slice) {
        }
      } else {
        jointRightSFRRef.current.configureMotorPosition(0, 1e5, 1e3);
        jointRightSLRRef.current.configureMotorPosition(0, 1e5, 1e3);
        jointRightSIRRef.current.configureMotorPosition(0, 1e5, 1e3);
      }
    }
    /**
     * Left Arm
     */
    if (jointLeftSFRRef.current) {
      if (forehand) {
        armLRef.current.applyImpulseAtPoint(
          { x: 10 * delta, y: 25 * delta, z: -5 * delta },
          armLRef.current.translation(),
          true
        );
        if (topspin) {
        }
        if (slice) {
        }
      } else if (backhand) {
        if (topspin) {
        }
        if (slice) {
        }
      } else {
        jointLeftSFRRef.current.configureMotorPosition(0, 1e5, 1e3);
        jointLeftSLRRef.current.configureMotorPosition(0, 1e5, 1e3);
        jointLeftSIRRef.current.configureMotorPosition(0, 1e5, 1e3);
      }
    }
    /**
     * Head
     */
    if (headRef.current)
      headRef.current.setNextKinematicTranslation({
        x: hipPosition.x,
        y: hipPosition.y + 1.3,
        z: hipPosition.z,
      });

    /**
     * Camera
     */

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(hipPosition);
    cameraPosition.z += 4.25;
    cameraPosition.y += 1.75;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(hipPosition);
    cameraTarget.z -= baselineZ;
    cameraTarget.y += 0.5;

    smoothedCameraPosition.lerp(cameraPosition, 5 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

    state.camera.position.copy(smoothedCameraPosition);
    state.camera.lookAt(smoothedCameraTarget);

    /**
     * Phase
     */
    if (hipPosition.z < -(blocksCount * 4 + 2)) end();

    if (hipPosition.y < -1) restart();
  });

  return (
    <>
      <RigidBody
        ref={legsRef}
        colliders="ball"
        restitution={0.5}
        friction={1}
        linearDamping={0.5}
        angularDamping={0.5}
        position={[0, 1, baselineZ]}
        density={300}
      >
        <mesh castShadow>
          <icosahedronGeometry args={[0.4, 1]} />
          <meshStandardMaterial flatShading color="mediumpurple" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={hipRef}
        type="kinematicPosition"
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
      >
        <mesh>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={torsoRef}
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
        position={[0, 2, baselineZ]}
      >
        <mesh>
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={shldrRARef}
        colliders="hull"
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
      >
        <mesh>
          <sphereGeometry args={[0.08, 10, 10, 0, -Math.PI, 0, Math.PI]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={shldrRBRef}
        colliders="hull"
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
      >
        <mesh>
          <sphereGeometry args={[0.08, 10, 10, 0, Math.PI, 0, Math.PI]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={armRRef}
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={100}
        position={[0, 1, baselineZ]}
      >
        <mesh>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={shldrLARef}
        colliders="hull"
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
      >
        <mesh>
          <sphereGeometry args={[0.08, 10, 10, 0, -Math.PI, 0, Math.PI]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={shldrLBRef}
        colliders="hull"
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={997}
      >
        <mesh>
          <sphereGeometry args={[0.08, 10, 10, 0, Math.PI, 0, Math.PI]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={armLRef}
        restitution={0}
        friction={0}
        linearDamping={0}
        angularDamping={0}
        density={100}
        position={[0, 1, baselineZ]}
      >
        <mesh>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={headRef}
        type="kinematicPosition"
        colliders="ball"
        restitution={0.5}
        friction={1}
        linearDamping={0.5}
        angularDamping={0.5}
        position={[0, 1, baselineZ]}
        density={997}
      >
        <mesh scale={[1, 1.2, 1]} castShadow>
          <icosahedronGeometry args={[0.13, 1]} />
          <meshStandardMaterial flatShading color="darkgray" />
        </mesh>
      </RigidBody>
      <Wall
        refMesh={legsRef}
        args={[2, 1, 0.01]}
        offset={[0, 1, -1]}
        position={[0, 1, baselineZ - 1]}
        restitution={0.7}
        density={1000}
        ccd
        onContactForce={(force) => {
          console.log(force.totalForce, force);
        }}
      />
    </>
  );
}
