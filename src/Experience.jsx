import { Physics } from '@react-three/rapier'
import useGame from './stores/useGame.jsx'
import Lights from './Lights.jsx'
import { Level } from './Level.jsx'
import Player from './Player.jsx'
import Effects from './Effects.jsx'
import Court from './Court.jsx'
import { OrbitControls } from '@react-three/drei'

export default function Experience() {
    const blocksCount = useGame((state) => state.blocksCount)
    const blocksSeed = useGame(state => state.blocksSeed)

    return <>
        <color args={['#252731']} attach="background" />
        <OrbitControls />
        <Physics debug>
            <Lights />
            <Court />
            {/* <Level count={blocksCount} seed={blocksSeed} /> */}
            <Player />
        </Physics>

        {/* <Effects /> */}
    </>
}