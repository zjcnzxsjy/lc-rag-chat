import React, { ReactNode, useEffect, useRef } from 'react'
import clsx from 'clsx'
import userImg from '@/assets/user.png'
import Botimg from '@/assets/bot.png'
import { createRagApplication } from './langchain'
import { IRagInstance } from './types'
import Loading from './components/loading'

import './App.css'

type MessageType = {
  type: string
  content: string | ReactNode
}

// const defaultMessages: MessageType[] = [
//   {
//     type: 'bot',
//     content: <Loading />
//   }
// ]

const avatarImg: Record<string, string> = {
  'user': userImg,
  'bot': Botimg,
}

function App() {
  const rag = useRef<IRagInstance>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = React.useState<MessageType[]>([])

  const init = async () => {
    rag.current = await createRagApplication();
  }

  const handleSubmit = async () => {
    if (!inputRef.current || !rag.current) {
      return
    }
    const userInput = inputRef.current.value
    setMessages([...messages, ...[
      {
        type: 'user',
        content: userInput
      },
      {
        type: 'bot',
        content: <Loading />
      }
    ]])
    inputRef.current.value = ''
    const results = await rag.current.query(userInput);
    setMessages((prev) => {
      const ret = prev.slice(0, prev.length - 1)
      return [...ret, {
        type: 'bot',
        content: results
      }]
    })
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <div className="chat-container">
        <div className="messages" id="messages">
          {messages.map((message, index) => {
            return (
              <div key={index} className={'message'}>
                <div className='avatar'>
                  <img src={avatarImg[message.type]} style={{ width: '100%', height: '100%' }}/>
                </div>
                <div className='content-wrapper'>
                  <span className='label'>{message.type}</span>
                  <section className={clsx('content', `${message.type}`)}>
                    {message.content}
                  </section>
                </div>
              </div>
            )
          })}
        </div>
        <div className="input-container">
          <input ref={inputRef}type="text" id="userInput" placeholder="输入你的消息..." />
          <button onClick={handleSubmit}>发送</button>
        </div>
    </div>
    </>
  )
}

export default App
