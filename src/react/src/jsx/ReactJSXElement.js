import hasOwnProperty from 'shared/hasOwnProperty'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
}
function hasValidKey (config) {
  return config.key !== undefined
}

function hasValidRef(config) {
  return config.ref !== undefined
}

function ReactElement(type, key, ref, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props
  }
}
// react 17之前老版的转换函数中，key是放在config里的，第三个参数放children
// react 17之后新版的转换函数中，key是放在第三个参数，children是放在config里的
export function jsxDEV(type, config, maybeKey) {
  let propName
  const props = {}
  let key = null
  let ref = null

  if(maybeKey !== undefined) {
    key = maybeKey
  }
  if(hasValidRef(config)) {
    ref = config.ref
  }
  for(propName in config) {
    if(hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName]
    }
  }

  return ReactElement(type, key, ref, props)
}