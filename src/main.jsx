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
  if(action.type === 'add') return state + action.payload
  return state
}
function FunctionComp () {
  const [number, setNumber] = React.useReducer(reducer, 0)

  return (
    <button onClick={() => setNumber({ type: 'add', payload: 1})}>{number}</button>
  )
}

const ele = <FunctionComp />
// console.log(ele)
const root = createRoot(document.getElementById('root'))
root.render(ele)