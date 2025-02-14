import React, { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const useAnimationFrame = (callback:((_:number)=>void)) => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef<number>(0);
  const previousTimeRef = React.useRef<number>(0);
  
  const animate = (time:number) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime)
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }
  
  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Make sure the effect runs only once
}

export default function App() {
  const [state, setState] = useState(init)
  let dispatch = (msg: Message) => {setState((s) => update(s, msg))}
  useAnimationFrame(delta => dispatch(delta))
  return view(state, dispatch)
}

//// CONFIG

//const umImg = 'um.png'
const slowness = 2500
//const horizTimeslice = 0.2

//// MODEL

type State = {
  pipes: Array<PipeRow>
  frameNum: number
  um: Um
}

type Pipe = {
  n: boolean
  e: boolean
  s: boolean
  w: boolean
}

type PipeRow = {
  y: number
  pipes: Array<Pipe>
}

type Um = {
  from: number
  to: number
  endFrameNum: number
  spin: boolean
}

function init(): State {
  return {
    frameNum: 0,
    pipes: [],
    // TODO: HACK HACK HACK from GotPipes handler
    um: { from: 2, to: 2, endFrameNum: 0, spin: false }
    // TODO: generatePipes(-1)
  }
}

//// MESSAGES

type Message = number


//// EVOLUTION

function update(model: State, delta: Message): State {
  let frameNum = model.frameNum + delta / slowness
  let pipes = updatePipes(frameNum, model.pipes)
  // TODO: Deal with um cmd
  return {...model, pipes, frameNum}
}

// Pipe grid

function updatePipes(frameNum: number, pipes: Array<PipeRow>): Array<PipeRow> {
  let visPipes = pipes.filter(p => boxY(p.y, frameNum) > -2);
  if (visPipes.length == 0) {
    return visPipes.concat([generatePipes(Math.floor(frameNum), null)]);
  } else {
    let lastPipe = visPipes[visPipes.length - 1];
    if (boxY(lastPipe.y, frameNum) > 6) {
      return visPipes;
    } else {
      return visPipes.concat([generatePipes(lastPipe.y + 1, lastPipe)]);
    }
  }
}

function toss(): boolean {
  return !!Math.floor(2 * Math.random());
}

function newPipe(): Pipe {
  return { n: toss(), s: toss(), e: toss(), w: toss() }
}

function generatePipes(y: number, prevRow: PipeRow | null): PipeRow {
  let newRow = {
    y: y,
    pipes: [ newPipe(), newPipe(), newPipe(), newPipe(), newPipe() ]
  }
  reconcileV(newRow, prevRow);
  reconcileH(newRow);
  return newRow;
}

function reconcileV(newRow: PipeRow, prevRow: PipeRow | null) {
  if (prevRow != null) {
    for (let i = 0; i < 5; ++i) {
      newRow.pipes[i].n = prevRow.pipes[i].s;
    }
  }
}

function reconcileH(newRow: PipeRow) {
  for (let i = 0; i < 4; ++i) {
    newRow.pipes[i].e = newRow.pipes[i+1].w;
  }
}

function boxY(y: number, frame: number) {
  return y - frame;
}

// Mon
// TODO

//// VIEW

function view(model:State, _dispatch:((msg: Message)=>void)) {
  return (
    <div>
      <svg viewBox ="0 0 480 400" width="480" height="400">
        {/* TODO umView */}
        { pipeGrid(model.frameNum, model.pipes) }
      </svg>
    </div>
  )
}


function pipeGrid(_frameNum: number, _pipes: Array<PipeRow>) {
  return (
    <circle cx="50" cy="50" r="10" />
  )
}
