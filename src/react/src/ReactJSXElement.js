import hasOwnProperty from "shared/hasOwnProperty"
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols"

function hasVaildKey(config) {
  return config.key !== undefined
}
function hasVaildRef(config) {
  return config.ref !== undefined
}

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
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
export function jsxDEV(type, config) {
  let propName
  const props = {}
  let key = null
  let ref = null

  if(hasVaildKey(config)) {
    key = config.key
  }
  if(hasVaildRef(config)) {
    ref = config.ref
  }
  for(propName in config) {
    if(hasOwnProperty.call(config, propName)
      && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName]
    }
  }

  return ReactElement(type, key, ref, props)
}