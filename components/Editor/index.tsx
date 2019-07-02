import { useEffect, useRef, useState } from 'react'
import styles from './styles.scss'

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

  const getCommand = () => {
    if (!!sel.focusNode.parentNode.attributes['data-checklist']) {
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
    const {
      focusNode: { parentNode, parentElement },
    } = sel
    console.log(cmd, val)

    if (d && sel) {
      const checkbox = parentElement.querySelector('[data-checkbox]')
      if (cmd === 'formatBlock') {
        // insert checklist item
        if (val === 'insertCheckList') {
          d.execCommand('formatBlock', false, 'div')

          checkListItem =
            sel.focusNode.textContent === ''
              ? sel.focusNode
              : sel.focusNode.parentNode.closest('div')
          checkListItem.className = 'checklist-item'
          checkListItem.setAttribute('data-checklist', '')
          const checkboxes = checkListItem.querySelectorAll('[data-checkbox]')

          if (checkboxes && checkboxes.length === 0) {
            appendCheckbox(checkListItem)
          }
        }

        if (val !== 'insertCheckList') {
          checkListItem = parentElement.closest('[data-checklist]')
          if (checkListItem) {
            checkListItem.removeAttribute('class')
            checkListItem.removeAttribute('data-checklist')

            if (checkbox) {
              checkListItem.removeChild(checkbox)
            }
          }
          d.execCommand(cmd, false, val)
        }

        // Unwrap list before formatBlock
        if (findNode(parentElement, 'li')) {
          if (findNode(parentElement, 'ol')) {
            d.execCommand('insertOrderedList', false, val)
          } else if (findNode(parentElement, 'ul')) {
            d.execCommand('insertUnorderedList', false, val)
          }
        }

        // Unwrap formatBlock before wrap list
      } else if (cmd === 'insertOrderedList' && parentNode.nodeName !== 'LI') {
        if (checkbox) {
          parentElement.closest('[data-checklist]').removeChild(checkbox)
        }
        checkListItem = parentElement.closest('[data-checklist]')
        if (checkListItem) {
          checkListItem.removeAttribute('class')
          checkListItem.removeAttribute('data-checklist')
        }
        d.execCommand('formatBlock', false, 'div')
      } else if (
        cmd === 'insertUnorderedList' &&
        parentNode.nodeName !== 'LI'
      ) {
        if (checkbox) {
          parentElement.closest('[data-checklist]').removeChild(checkbox)
        }
        checkListItem = parentElement.closest('[data-checklist]')
        if (checkListItem) {
          checkListItem.removeAttribute('class')
          checkListItem.removeAttribute('data-checklist')
        }
        d.execCommand('formatBlock', false, 'div')
      }

      d.execCommand(cmd, false, val)
      getCommand()
    }

    if (editor.current) {
      editor.current.focus()
    }
  }

  const appendCheckbox = (element: HTMLElement) => {
    element.insertAdjacentHTML(
      'afterbegin',
      '<label class="checkbox" data-checkbox><input type="checkbox" contentEditable="false"/></label>',
    )
  }

  const onKeyPress = (e: KeyboardEvent) => {
    if (
      ACTIONS.some(({ cmd }) => cmd === 'insertCheckList') &&
      e.charCode === 13
    ) {
      const range = document.createRange()
      const { focusNode } = sel
      checkListItem = focusNode.parentNode.closest('[data-checklist]')

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
      } else if (
        focusNode &&
        activeCommands.some(c => c === 'insertCheckList')
      ) {
        setTimeout(() => {
          if (!!checkListItem) {
            appendCheckbox(checkListItem.nextSibling)
            range.setStart(checkListItem.nextSibling, 1)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }, 0)
      }
    }
  }

  useEffect(() => {
    if (editor.current && !init) {
      editor.current.innerHTML = props.state
      setInit(true)
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
        onKeyPress={onKeyPress}
        onKeyDown={getCommand}
        onMouseUp={() => {
          getCommand()
          editor.current.focus()
        }}
      ></div>
    </div>
  )
}
