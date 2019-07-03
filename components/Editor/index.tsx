import { createRef, PureComponent, Ref, RefObject } from 'react'
import { HL_COLOR } from '../../contants/color'
import { findNode, getCommand } from '../../utils/editor'
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
        onClick: async (cmd: string) => {
          await this.exec(cmd)
          await this.parentNode.setAttribute('data-mark', 'bold')
        },
      },
      {
        cmd: 'italic',
        label: 'i',
        onClick: async (cmd: string) => {
          await this.exec(cmd)
          await this.parentNode.setAttribute('data-mark', 'italic')
        },
      },
      {
        cmd: 'underline',
        label: 'u',
        onClick: async (cmd: string) => {
          await this.exec(cmd)
          await this.parentNode.setAttribute('data-mark', 'underline')
        },
      },
      {
        cmd: 'strikeThrough',
        label: 's',
        onClick: async (cmd: string) => {
          await this.exec(cmd)
          await this.parentNode.setAttribute('data-mark', 'strikeThrough')
        },
      },
      {
        cmd: 'backColor',
        label: 'h',
        onClick: async (cmd: string) => {
          console.log()
          if (this.parentNode.style.backgroundColor !== HL_COLOR) {
            await this.exec(cmd, HL_COLOR)
            await this.parentNode.classList.add(styles['editor-highlight'])
            await this.parentNode.setAttribute('data-mark', 'backColor')
          } else {
            await this.exec('removeFormat')
          }
        },
      },
      {
        cmd: 'insertOrderedList',
        label: 'ol',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'insertUnorderedList',
        label: 'ul',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'p',
        label: 'p',
        onClick: (cmd: string) => this.exec('formatBlock', cmd),
      },
      {
        cmd: 'h2',
        label: 'h2',
        onClick: (cmd: string) => this.exec('formatBlock', cmd),
      },

      {
        cmd: 'h1',
        label: 'h1',
        onClick: (cmd: string) => this.exec('formatBlock', cmd),
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
          onKeyPress={this.onKeyPress}
          onMouseUp={this.getCommand}
        ></div>
      </div>
    )
  }

  private onKeyPress = () => {
    this.getCommand()
  }

  private getCommand = () => {
    this.setState({
      activeCommands: getCommand(this.state.actions),
    })
  }

  private exec = (cmd: string, val?: string) => {
    if (this.editor.current) this.editor.current.focus()
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
  }
}
