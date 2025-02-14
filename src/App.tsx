import React, { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface State {
  count: number;
}

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

function update(state: State, delta: number): State {
  return { ...state, count: state.count + delta * 0.01 }
}

function view(state: State, send:((d: number)=>void)) {
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
        <button onClick={() => send(10000)}>
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
  useAnimationFrame(delta => {setState((s) => update(s, delta))});
  return view(state, (delta) => setState((s) => update(s, delta)))
}

export default App
