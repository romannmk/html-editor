export const queryCommandState = (cmd: string) => {
  return document.queryCommandState(cmd)
}

export const queryCommandValue = (cmd: string) => {
  return document.queryCommandValue(cmd)
}

export const findNode = (element: HTMLElement, nodeName: string) => {
  if (element && nodeName) {
    const node = element.closest(nodeName)
    return node && !!node.nodeName
  }
  if (!element) return
}
