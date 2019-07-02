import { useEffect, useRef, useState } from 'react'
import {
  findNode,
  queryCommandState,
  queryCommandValue,
} from '../../utils/editor'
import styles from './styles.scss'

interface IEditor {
  state: string
  onChange?: (state: string) => void
}

export default function Editor(props: IEditor) {
  const ACTIONS = [
    {
      cmd: 'bold',
      label: 'b',
      onClick: (cmd: string) => exec(cmd),
    },
    {
      cmd: 'italic',
      label: 'i',
      onClick: (cmd: string) => exec(cmd),
    },
    {
      cmd: 'p',
      label: 'p',
      onClick: (cmd: string) => exec('formatBlock', cmd),
    },
    {
      cmd: 'h1',
      label: 'h1',
      onClick: (cmd: string) => exec('formatBlock', cmd),
    },
    {
      cmd: 'insertOrderedList',
      label: 'ol',
      onClick: (cmd: string) => exec(cmd),
    },
    {
      cmd: 'insertUnorderedList',
      label: 'ul',
      onClick: (cmd: string) => exec(cmd),
    },
    {
      cmd: 'insertCheckList',
      label: 'checklist',
      onClick: (cmd: string) => exec('formatBlock', cmd),
    },
  ]
  const editor = useRef<HTMLDivElement | null>(null)
  const [init, setInit] = useState(false)

  const [activeCommands, setActiveCommands] = useState([''])

  let d: Document
  let sel: any
  let checkListItem: any

  if (typeof document !== 'undefined') {
    d = document
    sel = d.getSelection()
  }

  // get active command and set active class to tolbar button
  const getCommand = () => {
    console.log('sel', checkListItem)
    if (!!checkListItem && checkListItem.hasAttribute('data-checklist')) {
      const inlineCommand = ACTIONS.filter(({ cmd }) => {
        if (queryCommandState(cmd)) {
          return queryCommandState(cmd)
        }
      }).map(({ cmd }) => cmd)

      setActiveCommands([...inlineCommand, 'insertCheckList'])
    } else {
      setActiveCommands(
        ACTIONS.filter(({ cmd }) => {
          if (queryCommandState(cmd)) {
            return queryCommandState(cmd)
          }
          if (queryCommandValue('formatBlock') === cmd) {
            return queryCommandValue('formatBlock')
          }
        }).map(({ cmd }) => cmd),
      )
    }
  }

  const exec = (cmd: string, val?: string) => {
    if (editor.current) {
      editor.current.focus()
    }
    const {
      focusNode: { parentNode, parentElement },
    } = sel
    console.log(cmd, val)

    const resetFormatBeforeCommand = () => {
      checkListItem = parentElement.closest('[data-checklist]')
      if (checkListItem) {
        checkListItem.innerHTML = parentElement.textContent
        checkListItem.removeAttribute('class')
        checkListItem.removeAttribute('data-checklist')
      }
      d.execCommand('formatBlock', true, 'div')
    }

    if (d && sel) {
      if (cmd === 'formatBlock') {
        // Unwrap list before formatBlock
        if (findNode(sel.focusNode.parentNode, 'li')) {
          if (findNode(sel.focusNode.parentNode, 'ol')) {
            d.execCommand('insertOrderedList', false, val)
          } else if (findNode(sel.focusNode.parentNode, 'ul')) {
            d.execCommand('insertUnorderedList', false, val)
          }
        }

        // insert checklist item
        if (val === 'insertCheckList') {
          d.execCommand('formatBlock', false, 'div')

          checkListItem =
            sel.focusNode.textContent === ''
              ? sel.focusNode
              : sel.focusNode.parentNode.closest('div')
          checkListItem.className = 'checklist-item'
          checkListItem.setAttribute('data-checklist', '')

          appendCheckbox(checkListItem)
        }

        if (val !== 'insertCheckList') {
          resetFormatBeforeCommand()
        }

        // Unwrap formatBlock before wrap list
      } else if (cmd === 'insertOrderedList' && parentNode.nodeName !== 'LI') {
        resetFormatBeforeCommand()
      } else if (
        cmd === 'insertUnorderedList' &&
        parentNode.nodeName !== 'LI'
      ) {
        resetFormatBeforeCommand()
      }

      d.execCommand(cmd, false, val)
      getCommand()
    }
  }

  const appendCheckbox = (element: HTMLElement) => {
    element.insertAdjacentHTML(
      'afterbegin',
      '<label class="checkbox" data-checkbox contentEditable="true"><input type="checkbox" contentEditable="false"/></label>',
    )
  }

  const onKeyUp = ({ charCode }: { charCode: number }) => {
    const range = document.createRange()
    const { focusNode } = sel
    checkListItem =
      focusNode.parentNode.closest('[data-checklist]') ||
      focusNode.parentNode.parentNode.closest('[data-checklist]')

    if (
      ACTIONS.some(({ cmd }) => cmd === 'insertCheckList') &&
      charCode === 13
    ) {
      if (
        focusNode.textContent === '' &&
        !activeCommands.some(c => c === 'p')
      ) {
        focusNode.removeAttribute('class')
        focusNode.removeAttribute('data-checklist')
        setTimeout(() => {
          exec('formatBlock', 'p')
          focusNode.innerHTML = ' '
        }, 0)
      } else if (checkListItem) {
        setTimeout(() => {
          appendCheckbox(checkListItem.nextSibling)
          range.setStart(checkListItem.nextSibling, 1)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        }, 0)
      }
    }

    getCommand()
  }

  useEffect(() => {
    if (editor.current && !init) {
      editor.current.innerHTML = props.state
      setInit(true)
    }

    if (editor.current && !editor.current.innerHTML) {
      exec('formatBlock', 'p')
    }
  })

  return (
    <div className={styles.editor}>
      <div className={styles['editor-toolbar']}>
        {ACTIONS.map(({ cmd, label, onClick }) => {
          return (
            <button
              key={label}
              className={activeCommands.some(c => cmd === c) ? 'active' : ''}
              onClick={() => onClick(cmd)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div
        ref={editor}
        className={styles['editor-content']}
        contentEditable
        onKeyPress={onKeyUp}
        onMouseUp={getCommand}
      ></div>
    </div>
  )
}
