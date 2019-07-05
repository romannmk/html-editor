export interface IAction {
  cmd: string
  label: string
  onClick: (cmd: IAction['cmd']) => void
}

export interface IEditorProps {
  state: string
  onChange?: (state: string) => void
  spellCheck?: boolean
  autoFocus?: boolean
  actions: string[] | any
}

export interface IEditorState {
  actions: IAction[]
  activeCommands: string[]
}
