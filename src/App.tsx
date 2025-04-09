import { ReactNode, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import userImg from '@/assets/user.png'
import Botimg from '@/assets/bot.png'
import RagApplication from './langchain'
import Loading from './components/loading'
import FileUpload from './components/upload'
import { webLoadPDF } from './langchain/components/doc_loader/pdf_loader'

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
  const rag = useRef<RagApplication>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<MessageType[]>([])

  const init = async () => {
    rag.current = new RagApplication
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRequest = async (res: any) => {
    console.log('res', res)
    const { file, onSuccess, onError } = res
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer]);
        const doc = await webLoadPDF(blob)
        console.log('doc', doc)
        rag.current?.addDocs(doc)
        onSuccess()
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.log('error', error)
      onError(error)
    }
    
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
    rag.current.stream(userInput, (chunk: string) => {
      setMessages((prev) => {
        const ret = prev.slice(0, prev.length - 1)
        return [...ret, {
          type: 'bot',
          content: chunk
        }]
      })
    });
    
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className='wrapper'>
      <div className='upload-wrapper'>
        <FileUpload
          customRequest={handleRequest}
        />
      </div>
      <div className='chat-wrapper'>
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
      </div>
      
    </div>
  )
}

export default App
