import { createRef, PureComponent } from 'react'
import { COLORS, DEFAULT_NODE } from '../../contants'
import { bind, timeout } from '../../utils/decorators'
import {
  findNode,
  getCommand,
  queryCommandState,
  queryCommandValue,
} from '../../utils/editor'
import styles from './styles.scss'

interface IEditor {
  state: string
  onChange?: (state: string) => void
  spellCheck: boolean
}

export default class Editor extends PureComponent<IEditor> {
  public state = {
    actions: [
      {
        cmd: 'bold',
        label: 'b',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'italic',
        label: 'i',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'underline',
        label: 'u',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'strikeThrough',
        label: 's',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'backColor',
        label: 'h',
        onClick: (cmd: string) => {
          if (
            this.parentNode.closest('[style]') &&
            this.parentNode.style.backgroundColor === COLORS.highlight
          ) {
            this.exec(cmd, 'transparent')
            this.getCommand()
          } else {
            this.exec(cmd, COLORS.highlight)
          }
        },
      },
      {
        cmd: 'insertOrderedList',
        label: 'ol',
        onClick: async (cmd: string) => {
          if (!queryCommandState(cmd)) {
            await this.exec(cmd)
          } else {
            await this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
      {
        cmd: 'insertUnorderedList',
        label: 'ul',
        onClick: async (cmd: string) => {
          if (!queryCommandState(cmd)) {
            await this.exec(cmd)
          } else {
            await this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
      {
        cmd: DEFAULT_NODE,
        label: 'p',
        onClick: (cmd: string) => this.exec('formatBlock', cmd),
      },
      {
        cmd: 'h2',
        label: 'h2',
        onClick: (cmd: string) => {
          if (queryCommandValue('formatBlock') !== cmd) {
            this.exec('formatBlock', cmd)
          } else {
            this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
      {
        cmd: 'h1',
        label: 'h1',
        onClick: (cmd: string) => {
          if (queryCommandValue('formatBlock') !== cmd) {
            this.exec('formatBlock', cmd)
          } else {
            this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
    ],
    activeCommands: [''],
    checkListItem: null,
  }

  private doc!: HTMLDocument | any
  private parentNode!: ParentNode | any
  private editor = createRef<HTMLDivElement>()

  public componentDidMount() {
    if (this.editor.current) this.editor.current.innerHTML = this.props.state
    this.doc = document
  }

  public componentDidUpdate() {
    this.parentNode = this.doc.getSelection().focusNode.parentNode
    console.log('parentNode', this.parentNode, this.parentNode.nodeName)
    if (this.editor.current && this.editor.current.innerHTML === '') {
      this.exec('formatBlock', DEFAULT_NODE)
    }
  }

  public render() {
    const { activeCommands, actions } = this.state
    const { spellCheck } = this.props

    return (
      <div className={styles.editor}>
        <div className={styles['editor-toolbar']}>
          {actions.map(({ cmd, label, onClick }) => {
            return (
              <button
                key={label}
                className={activeCommands.some(c => cmd === c) ? 'active' : ''}
                onMouseDown={() => onClick(cmd)}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div
          ref={this.editor}
          className={styles['editor-content']}
          spellCheck={spellCheck}
          contentEditable
          onKeyDown={this.onKeyDown}
          onMouseUp={this.getCommand}
        ></div>
      </div>
    )
  }

  @bind
  private onKeyDown({ keyCode }: { keyCode: number }) {
    this.getCommand()
    if (
      this.parentNode.nodeName === 'UL' &&
      !queryCommandState('insertUnorderedList')
    ) {
      this.resetBeforeTitle()
    }
    if (
      this.parentNode.nodeName === 'OL' &&
      !queryCommandState('insertOrderedList')
    ) {
      this.resetBeforeTitle()
    }
    if (
      keyCode === 13 &&
      ['h1', 'h2', 'h3'].some(f => f === queryCommandValue('formatBlock'))
    ) {
      this.resetBeforeTitle()
    }
  }

  @bind
  @timeout(0)
  private resetBeforeTitle() {
    this.exec('formatBlock', DEFAULT_NODE)
  }

  @bind
  private getCommand() {
    this.setState({
      activeCommands: getCommand(this.state.actions),
    })
  }

  @bind
  private exec(cmd: string, val?: string) {
    // reset format before command
    const reset = () => {
      document.execCommand('formatBlock', true, 'div')
    }

    if (cmd === 'formatBlock') {
      // Unwrap list before formatBlock
      if (findNode(this.parentNode, 'li')) {
        if (findNode(this.parentNode, 'ol')) {
          this.doc.execCommand('insertOrderedList', false, val)
        } else if (findNode(this.parentNode, 'ul')) {
          this.doc.execCommand('insertUnorderedList', false, val)
        }
      }

      // Unwrap formatBlock before wrap list
    } else if (
      !findNode(this.parentNode, 'li') &&
      (cmd === 'insertOrderedList' || cmd === 'insertUnorderedList')
    ) {
      reset()
    }
    this.doc.execCommand(cmd, false, val)
    this.getCommand()

    if (this.editor.current) this.editor.current.focus()
  }
}
