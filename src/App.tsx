import React, { useState } from 'react'

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

const umImg = 'um.png'
const slowness = 2500
const horizTimeslice = 0.2

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
  let um = updateUm(frameNum, pipes, model.um);
  return {...model, pipes, frameNum, um}
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

function updateUm(frame: number, pipes: Array<PipeRow>, um: Um): Um {
  if (frame <= um.endFrameNum) {
    return um;
  } else {
    console.log(`frame ${frame} <= ${um.endFrameNum}`);
    console.log(um);
    let target = Math.floor(60 * Math.random());
    let [dest, spin] = selectGoal(pipes, um.to, target);
    let newUm = {from: um.to, to: dest, endFrameNum: Math.ceil(frame), spin}
    console.log(newUm);
    return newUm;
  }
}

function selectGoal(rows: Array<PipeRow>, currentCol: number, target: number): [number, boolean] {
  if (rows.length < 3) {
    return [currentCol, true];
  } else {
    let row = rows[2];
    let connected = findConnected(currentCol, row.pipes);
    console.log(connected);
    console.log(target);
    if (connected.length == 0) {
      // Tumble in the void.
      return [currentCol, true];
    } else {
      // Can we get anywhere that lets us proceed?
      let unblocked = connected.filter(i => row.pipes[i].s);
      let [candidates, spin] = unblocked.length == 0 ? [connected, true] : [unblocked, false];
      console.log(candidates);
      console.log(`target ${target} mod ${candidates.length} is ${target % candidates.length}`);
      return [candidates[target % candidates.length], spin]
    }
  }
}

function findConnected(start: number, pipes: Array<Pipe>) {
  return [0,1,2,3,4].filter(i => connected(pipes, start, i));
}

function connected(pipes: Array<Pipe>, start: number, end: number) {
  if (start == end) {
    // Wherever you go, there you are.
    return true;
  } else if (start < end) {
    return pipes.slice(start, end).every(p => p.e);
  } else {
    return pipes.slice(end+1, start+1).every(p => p.w);
  }
}


//// VIEW

function view(model:State, _dispatch:((msg: Message)=>void)) {
  return (
    <div>
      <svg viewBox="0 0 480 400" width="480" height="400">
        { pipeGrid(model.frameNum, model.pipes) }
        { umView(model.frameNum, model.um) }
      </svg>
    </div>
  )
}

function pipeGrid(frameNum: number, rows: Array<PipeRow>) {
  return (
    <svg x="0" y="0" width="480" height="400" viewBox="0 0 6 3">
      { rows.map(row =>
                 row.pipes.map((pipe, i) =>
                               pipeCell(i + 0.5, boxY(row.y, frameNum), pipe))) }
    </svg>
  )
}

const ne = "M 6 0 L 6 3 A 1 1 0 0 0 7 4 L 10 4"
const es = "M 6 10 L 6 7 A 1 1 0 0 1 7 6 L 10 6"
const sw = "M 0 6 L 3 6 A 1 1 0 0 1 4 7 L 4 10"
const wn = "M 0 4 L 3 4 A 1 1 0 0 0 4 3 L 4 0"
const ns = "M 6 0 L 6 10"
const sn = "M 4 0 L 4 10"
const we = "M 0 4 L 10 4"
const ew = "M 0 6 L 10 6"
const neo = "M 4 0 L 4 5 A 1 1 0 0 0 5 6 L 10 6"
const eso = "M 4 10 L 4 5 A 1 1 0 0 1 5 4 L 10 4"
const swo = "M 0 4 L 5 4 A 1 1 0 0 1 6 5 L 6 10"
const wno = "M 0 6 L 5 6 A 1 1 0 0 0 6 5 L 6 0"
const nx = "M 4 0 L 4 3 L 6 3 L 6 0"
const ex = "M 10 4 L 7 4 L 7 6 L 10 6"
const sx = "M 6 10 L 6 7 L 4 7 L 4 10"
const wx = "M 0 6 L 3 6 L 3 4 L 0 4"

function pipeCell(x: number, y: number, {n, s, e, w}: Pipe) {
  return (
    <svg x={x} y={y} width="1" height="1" viewBox="0 0 10 10" key={`${x}_${y}`}>
      {pathIf(ne, n && e)}
      {pathIf(es, e && s)}
      {pathIf(sw, s && w)}
      {pathIf(wn, w && n)}
      {pathIf(ns, n && s && !e)}
      {pathIf(sn, s && n && !w)}
      {pathIf(we, w && e && !n)}
      {pathIf(ew, e && w && !s)}
      {pathIf(neo, n && e && !s && !w)}
      {pathIf(eso, e && s && !w && !n)}
      {pathIf(swo, s && w && !n && !e)}
      {pathIf(wno, w && n && !e && !s)}
      {pathIf(nx, n && !e && !s && !w)}
      {pathIf(ex, e && !s && !w && !n)}
      {pathIf(sx, s && !w && !n && !e)}
      {pathIf(wx, w && !n && !e && !s)}
    </svg>
  )
}

function pathIf(path: string, cond: boolean) {
  if (cond) {
    return (
      <path d={path} stroke="blue" fill="none" strokeWidth="0.2" />
    )
  } else {
    return <></>
  }
}

// Mon

function umView(frame: number, um: Um) {
  let x = 40 + 80 * xUm(frame, um);
  let y = 70 + 80 * yUm(frame, um);
  let r = um.spin ? 360 * Math.max(0, (((1 + horizTimeslice) * umParam(frame, um)) - horizTimeslice)) : 0;
  return (
    <foreignObject x={x} y={y} width="100" height="100" transform={rotation(r, x)}>
      <img src={umImg} width="80" height="80" />
    </foreignObject>
  )
}

function xUm(frame: number, um: Um) {
  return interp(um.from, um.to, umParam(frame, um), horizTimeslice);
}

function yUm(frame: number, um: Um) {
  let t = umParam(frame, um);
  if (t < horizTimeslice) {
    return 1-t;
  } else {
    return (1 - 2 * horizTimeslice + horizTimeslice * t) / (1 - horizTimeslice);
  }
}

function umParam(frame: number, um: Um) {
  return 1 + frame - um.endFrameNum;
}

function interp(a: number, b: number, t: number, s: number) {
  let tt = Math.min(1, t/s);
  return b * tt + a * (1-tt);
}

function rotation(rot: number, pos: number) {
  let x = pos + 45;
  let y = 175;
  return `rotate(${rot}, ${x}, ${y})`;
}
