import Head from 'next/head'
import { createRef, PureComponent } from 'react'
import { COLORS, DEFAULT_NODE } from '../../contants'
import { IAction, IEditorProps, IEditorState } from '../../interfaces/editor'
import { bind, timeout } from '../../utils/decorators'
import {
  findNode,
  getCommand,
  queryCommandState,
  queryCommandValue,
} from '../../utils/editor'
import styles from './styles.scss'

export default class Editor extends PureComponent<IEditorProps, IEditorState> {
  private doc!: HTMLDocument | any
  private parentNode!: ParentNode | any
  private editor = createRef<HTMLDivElement>()

  public constructor(props: IEditorProps) {
    super(props)

    const defaultCommands: IAction[] = [
      {
        cmd: 'undo',
        label: 'undo',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'redo',
        label: 'redo',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'divider',
        label: '',
        onClick: () => null,
      },
      {
        cmd: 'bold',
        label: 'format_bold',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'italic',
        label: 'format_italic',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'underline',
        label: 'format_underline',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'strikeThrough',
        label: 'strikethrough_s',
        onClick: (cmd: string) => this.exec(cmd),
      },
      {
        cmd: 'backColor',
        label: 'format_color_fill',
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
        cmd: 'divider',
        label: '',
        onClick: () => null,
      },
      {
        cmd: 'blockquote',
        label: 'format_quote',
        onClick: (cmd: string) => {
          if (queryCommandValue('formatBlock') !== cmd) {
            this.exec('formatBlock', cmd)
          } else {
            this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
      {
        cmd: 'insertOrderedList',
        label: 'format_list_numbered',
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
        label: 'format_list_bulleted',
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
        label: 'title',
        onClick: (cmd: string) => this.exec('formatBlock', cmd),
      },
      {
        cmd: 'h2',
        label: 'looks_two',
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
        label: 'looks_one',
        onClick: (cmd: string) => {
          if (queryCommandValue('formatBlock') !== cmd) {
            this.exec('formatBlock', cmd)
          } else {
            this.exec('formatBlock', DEFAULT_NODE)
          }
        },
      },
    ]

    this.state = {
      actions: props.actions.map((action: string) =>
        defaultCommands.find(({ cmd }) => action === cmd),
      ),
      activeCommands: [''],
    }
  }

  public componentDidMount() {
    this.doc = document

    if (this.editor.current) {
      this.editor.current.innerHTML = this.props.state
      if (this.props.autoFocus) this.editor.current.focus()
    }
  }

  public componentDidUpdate() {
    this.parentNode = this.doc.getSelection().focusNode.parentNode
    if (this.editor.current && this.editor.current.innerHTML === '') {
      this.exec('formatBlock', DEFAULT_NODE)
    }

    console.log('parentNode', this.parentNode, this.parentNode.nodeName)
  }

  public render() {
    const { activeCommands, actions } = this.state
    const { spellCheck } = this.props

    return (
      <>
        <Head>
          <link
            href="https://fonts.googleapis.com/icon?family=Material+Icons"
            rel="stylesheet"
          ></link>
        </Head>
        <div className={styles.editor}>
          <div className={styles.toolbar}>
            {actions.map(({ cmd, label, onClick }) => {
              const key = +new Date() + Math.random()
              if (cmd === 'divider') {
                return (
                  <span key={key} className={styles.toolbar__divider}>
                    {label}
                  </span>
                )
              }
              return (
                <button
                  key={key}
                  className={
                    activeCommands.some(c => cmd === c)
                      ? `${styles.toolbar__btn} ${styles['toolbar__btn--active']}`
                      : styles.toolbar__btn
                  }
                  onMouseDown={() => onClick(cmd)}
                >
                  <span className="material-icons">{label}</span>
                </button>
              )
            })}
          </div>
          <div
            ref={this.editor}
            contentEditable
            className={styles.content}
            spellCheck={spellCheck || false}
            onInput={this.onChange}
            onKeyDown={this.onKeyDown}
            onMouseUp={this.getCommand}
          ></div>
        </div>
      </>
    )
  }

  @bind private onChange(e: React.FormEvent<HTMLDivElement>) {
    if (this.props.onChange) this.props.onChange(e.currentTarget.innerHTML)
  }

  @bind private onKeyDown({ keyCode }: { keyCode: number }) {
    this.getCommand()
    if (
      this.parentNode &&
      this.parentNode.nodeName === 'UL' &&
      !queryCommandState('insertUnorderedList')
    ) {
      this.resetBeforeTitle()
    }
    if (
      this.parentNode &&
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
      this.doc.execCommand('formatBlock', false, 'div')
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
