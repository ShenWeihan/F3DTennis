import { Physics } from '@react-three/rapier'
import useGame from './stores/useGame.jsx'
import Lights from './Lights.jsx'
import Player from './Player.jsx'
// import Effects from './Effects.jsx'
import Court from './Court.jsx'
import Ball from './Ball.jsx'
import { Perf } from 'r3f-perf'
import { Suspense } from 'react'

export default function Experience({ sequence }) {
    const blocksCount = useGame((state) => state.blocksCount)
    const blocksSeed = useGame(state => state.blocksSeed)

    return <>
        <Perf position='bottom-right' />
        <color args={['#252731']} attach="background" />
        <Suspense>
            <Physics debug >
                <Lights />
                <Court />
                <Ball />
                <Player sequence={sequence} />
            </Physics>
        </Suspense>
        {/* <Effects /> */}
    </>
}