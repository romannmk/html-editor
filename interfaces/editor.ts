export interface IAction {
  cmd: string
  label: string
  onClick: (cmd: IAction['cmd']) => void
}
