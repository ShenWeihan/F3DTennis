import "./style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./Experience.jsx";
import { KeyboardControls, Loader } from "@react-three/drei";
import { Leva } from "leva";
// import Interface from './Interface.jsx'
import { getProject } from '@theatre/core'
import studio from '@theatre/studio'
import extension from '@theatre/r3f/dist/extension'
import { SheetProvider } from '@theatre/r3f'


// our Theatre.js project sheet, we'll use this later
const forehandSheet = getProject('F3DTennis').sheet('Forehand')
// Vite
if (import.meta.env.DEV) {
  studio.initialize()
  studio.extend(extension)
}


const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <KeyboardControls
    map={[
      { name: "forward", keys: ["KeyW", "ArrowUp"] },
      { name: "backward", keys: ["KeyS", "ArrowDown"] },
      { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
      { name: "rightward", keys: ["KeyD", "ArrowRight"] },
      { name: "chop", keys: ["Shift"] },
      { name: "forehand", keys: ["KeyL"] },
      { name: "backhand", keys: ["KeyJ"] },
      { name: "topspin", keys: ["KeyI"] },
      { name: "reload", keys: ["KeyR"] },
      { name: "slice", keys: ["KeyK"] },
      { name: "jump", keys: ["Space"] },
      { name: "serve", keys: ["Enter"] },
    ]}
  >
    <Leva collapsed />
    <Canvas
      shadows
      camera={{
        fov: 45,
        near: 0.1,
        far: 200,
        position: [2.5, 4, 6],
      }}
    >
      <SheetProvider sheet={forehandSheet}>
        <Experience sequence={forehandSheet.sequence} />
      </SheetProvider >
    </Canvas>
    <Loader />
    {/* <Interface /> */}
  </KeyboardControls>
);
