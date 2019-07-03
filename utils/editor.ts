import { HL_COLOR } from '../contants/color'
import { IAction } from '../interfaces/editor'

export const queryCommandState = (cmd: IAction['cmd']) => {
  return document.queryCommandState(cmd)
}

export const queryCommandValue = (cmd: IAction['cmd']) => {
  return document.queryCommandValue(cmd)
}

export const findNode = (element: HTMLElement, nodeName: string) => {
  if (element && nodeName) {
    const node = element.closest(nodeName)
    return node && !!node.nodeName
  }
  if (!element) return
}

export const appendCheckbox = (element: HTMLElement) => {
  element.insertAdjacentHTML(
    'afterbegin',
    '<label class="checkbox" data-checkbox contentEditable="true"><input type="checkbox" contentEditable="false"/></label>',
  )
}

export const getCommand = (actions: IAction[]) => {
  return actions
    .filter(({ cmd }) => {
      if (queryCommandState(cmd)) {
        return queryCommandState(cmd)
      }

      if (queryCommandValue('formatBlock') === cmd) {
        return queryCommandValue('formatBlock')
      }
      if (queryCommandValue(cmd) === HL_COLOR) {
        return queryCommandValue('backColor')
      }
    })
    .map(({ cmd }) => cmd)
}
