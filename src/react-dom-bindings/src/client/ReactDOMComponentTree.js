const randomKey = Math.random().toString(36).slice(2)
const internalInstanceKey = `_reactFiber$${randomKey}`
const internalPropsKey = `_reactProps${randomKey}`

export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey]
  return targetInst || null
}

/**
 * 提前缓存fiber节点的实例到真实DOM上
 * @param {*} hostInst fiber节点
 * @param {*} node 真实DOM
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null
}