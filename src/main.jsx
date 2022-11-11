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

// function reducer(state, action) {
//   if(action.type === 'add') return state + 1
//   return state
// }
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
function FunctionComp () {
  // const [number, setNumber] = React.useReducer(reducer, 0)
  const [number, setNumber] = React.useState(0)

  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A">A</li>
      <li key="B" id="B">B</li>
      <li key="C" id="C">C</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A2">A2</li>
      <p key="B" id="B">B</p>
      <li key="C" id="C2">C2</li>
    </ul>
  )
}

const ele = <FunctionComp />
// console.log(ele)
const root = createRoot(document.getElementById('root'))
root.render(ele)