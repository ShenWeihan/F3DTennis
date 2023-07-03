import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import { KeyboardControls, Loader } from '@react-three/drei'

// import Interface from './Interface.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <KeyboardControls
        map={[
            { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
            { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
            { name: 'leftward', keys: ['KeyA', 'ArrowLeft'] },
            { name: 'rightward', keys: ['KeyD', 'ArrowRight'] },
            { name: 'chop', keys: ['Shift'] },
            { name: 'forehand', keys: ['KeyL'] },
            { name: 'backhand', keys: ['KeyJ'] },
            { name: 'topspin', keys: ['KeyI'] },
            { name: 'reload', keys: ['KeyR'] },
            { name: 'slice', keys: ['KeyK'] },
            { name: 'jump', keys: ['Space'] },
            { name: 'serve', keys: ['Enter'] },
        ]}
    >
        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [2.5, 4, 6]
            }}
        >
            <Experience />
        </Canvas>
        <Loader />
        {/* <Interface /> */}
    </KeyboardControls>
)