import { createRoot } from 'react-dom/client'

// let ele = (
//   <h1>
//     hello<span style={{color: 'red'}}>world</span>
//   </h1>
// )
// function FunctionComp () {
//   return (
//     <h1 onClick={(event) => console.log('parentBubble', event.currentTarget)} onClickCapture={(event) => console.log('parentCapture')}>
//       hello<span style={{color: 'red'}} onClick={(event) => event.stopPropagation()} onClickCapture={(event) => console.log('childCapture', event.currentTarget)}>world</span>
//     </h1>
//   )
// }
import * as React from 'react'

function reducer(state, action) {
  if(action.type === 'add') return state + 1
  return state
}
// function FunctionComp () {
//   console.log('Func')
//   // const [number, setNumber] = React.useReducer(reducer, 0)
//   const [number, setNumber] = React.useState(0)

//   return (
//     <button onClick={() => {
//       // setNumber({ type: 'add', payload: 1 })
//       setNumber(number + 1)
//       setNumber(number + 2)
//     }}>{number}</button>
//   )
// }
// function FunctionComp () {
//   const [number, setNumber] = React.useState(0)

//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B">B</li>
//       <li key="C">C</li>
//       <li key="D">D</li>
//       <li key="E">E</li>
//       <li key="F">F</li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A2</li>
//       <li key="C">C2</li>
//       <li key="E">E2</li>
//       <li key="B">B2</li>
//       <li key="G">G</li>
//       <li key="D">D2</li>
//     </ul>
//   )
// }

function FunctionComp () {
  const [number, setNumber] = React.useState(0)
  React.useEffect(() => {
    console.log('useEffect1')
    return () => {
      console.log('destroy useEffect1')
    }
  }, [])
  React.useEffect(() => {
    console.log('useEffect2')
    return () => {
      console.log('destroy useEffect2')
    }
  })
  React.useEffect(() => {
    console.log('useEffect3')
    return () => {
      console.log('destroy useEffect3')
    }
  })

  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}

const ele = <FunctionComp />
// console.log(ele)
const root = createRoot(document.getElementById('root'))
root.render(ele)