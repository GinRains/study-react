import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
  return ReactCurrentDispatcher.current
}
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useReducer(reducer, initialArg)
}