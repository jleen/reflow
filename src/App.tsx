import React, { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

type State = {
  count: number
}

type Tick = {
  msg: "tick"
  delta: number
}

type Click = {
  msg: "click"
}

type Message = Tick | Click

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

function init(): State {
  return { count: 0 }
}

function update(state: State, msg: Message): State {
  switch (msg.msg) {
    case "tick":
      return { ...state, count: state.count + msg.delta * 0.01 }
    case "click":
      return { ...state, count: state.count + 100 }
  }
}

function view(state: State, dispatch:((msg: Message)=>void)) {
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => dispatch({msg: "click"})}>
          count is {Math.floor(state.count)}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  const [state, setState] = useState(init)
  let dispatch = (msg: Message) => {setState((s) => update(s, msg))}
  useAnimationFrame(delta => dispatch({msg: "tick", delta: delta}))
  return view(state, dispatch)
}

export default App
