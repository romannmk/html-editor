import { useState } from 'react'
import Editor from '../components/Editor'

export default () => {
  const [state, setState] = useState('<h1>Simple title</h1><p>Simple text</p>')
  return (
    <div>
      <Editor
        actions={[
          'bold',
          'italic',
          'divider',
          'blockquote',
          'insertOrderedList',
          'insertUnorderedList',
          'h2',
          'h1',
        ]}
        state={state}
        onChange={value => setState(value)}
      />
    </div>
  )
}
