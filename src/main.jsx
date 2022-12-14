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
//   const [number, setNumber] = React.useReducer(reducer, 0)
//   // const [number, setNumber] = React.useState(0)

//   return (
//     <button onClick={() => {
//       setNumber({ type: 'add', payload: 1 })
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

// function FunctionComp () {
//   const [number, setNumber] = React.useState(0)
//   React.useEffect(() => {
//     console.log('useEffect1')
//     return () => {
//       console.log('destroy useEffect1')
//     }
//   }, [])
//   React.useLayoutEffect(() => {
//     console.log('useLayoutEffect2')
//     return () => {
//       console.log('destroy useLayoutEffect2')
//     }
//   })
//   React.useEffect(() => {
//     console.log('useEffect3')
//     return () => {
//       console.log('destroy useEffect3')
//     }
//   })

//   return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
// }
// function FunctionComp() {
//    const [numbers, setNumbers] = React.useState(new Array(10).fill('A'));
//    console.log('numbers', numbers)
//    const divRef = React.useRef();
//    React.useEffect(() => {
//     console.log('ref', divRef.current)
//      setTimeout(() => {
//        divRef.current.click();
//      }, 10);
//     setTimeout(() => {}, 10)
//     setNumbers(numbers => numbers.map(item => item + 'B'))
//    }, []);
//    return (<div ref={ina => (divRef.current = ina)} onClick={() => {
//      setNumbers(numbers => numbers.map(item => item + 'C'))
//    }}>{numbers.map((number, index) => <span key={index}>{number}</span>)}</div>)
// }
// function FunctionComp() {
//   const [number, setNumber] = React.useState(0)
//   return <button onClick={() => {
//     setNumber((number) => number + 1)
//     setNumber((number) => number + 2)
//   }}>{number}</button>
// }
let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
function FunctionComp() {
  const [numbers, setNumbers] = React.useState(new Array(50).fill('A'));
  const divRef = React.useRef();
  const updateB = (numbers) => new Array(50).fill(numbers[0] + 'B')
  updateB.id = 'updateB' + (bCounter++);
  const updateC = (numbers) => new Array(50).fill(numbers[0] + 'C')
  updateC.id = 'updateC' + (cCounter++);
  React.useEffect(() => {
    timer = setInterval(() => {
      divRef.current.click();
      if (counter++ === 0) {
        setNumbers(updateB)
      }
      divRef.current.click();
      if (counter++ > 10) {
        clearInterval(timer)
      }
    });
  }, []);
  return (<div ref={divRef} onClick={() => {
    setNumbers(updateC)}
  }>
    {numbers.map((number, index) => <span key={index}>{number}</span>)}</ div>)
}

const ele = <FunctionComp />
const root = createRoot(document.getElementById('root'))
// console.log('ele', ele)
root.render(ele)