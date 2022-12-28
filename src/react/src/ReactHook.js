import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
  return ReactCurrentDispatcher.current
}
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useReducer(reducer, initialArg)
}
export function useState(initialState) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}
export function useEffect(effect, deps) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(effect, deps)
}
export function useLayoutEffect(effect, deps) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useLayoutEffect(effect, deps)
}
export function useRef(initialValue) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useRef(initialValue)
}