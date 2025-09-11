"use client"

import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send, MessageSquare, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"


interface Message {
    id: string
    text: string
    role: "user" | "assistant" | "system"
    time?: string
}

export default function ChatPage() {
    
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([
        { id: uuidv4(), text: 'Welcome to AI Career Coach — ask career, resume, or interview questions.', role: 'system', time: new Date().toISOString() }
    ])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const listRef = useRef<HTMLDivElement | null>(null)
    const { chatid } = useParams()
    console.log('Chat ID:', chatid)
    useEffect(() =>{
        // save to database 
        async function saveChat(){
            try {
                const res = await fetch('/api/chat/save', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ messages, chatSessionId: chatid }),
                })
                if (!res.ok) {
                    const body = await res.text()
                    console.error('[saveChat] failed', res.status, body)
                } else {
                    const data = await res.json()
                    console.log('[saveChat] saved', data)
                }
            } catch (error) {
                console.log('Failed to save chat:', error)
            }
        }
        // call the save function whenever messages change
        saveChat()
    },[messages])

    useEffect(() => {
        // Scroll to bottom when messages change
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    }, [messages])

    function pushMessage(message: Message) {
        setMessages((m) => [...m, message])
    }

    function renderMessageContent(text: string) {
        // Very small markdown-like renderer: handle code blocks and simple newlines/bold
        // This is intentionally minimal; replace with react-markdown if you prefer full support.
        if (!text) return null

        // Handle JSON content that starts with {
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(text)
                if (parsed.content) {
                    text = parsed.content
                }
            } catch (e) {
                // If not valid JSON, continue with original text
            }
        }

        // Render code blocks fenced with ```
        if (text.includes('```')) {
            const parts = text.split(/(```[\s\S]*?```)/g)
            return parts.map((part, i) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const content = part.slice(3, -3).trim()
                    return (
                        <pre key={i} className="my-2 rounded bg-slate-900 text-slate-100 p-3 overflow-auto text-sm whitespace-pre-wrap">
                            <code>{content}</code>
                        </pre>
                    )
                }
                return <span key={i}>{renderBasicMarkdown(part)}</span>
            })
        }

        return renderBasicMarkdown(text)
    }

    function renderBasicMarkdown(text: string) {
        // Replace **bold** and *italic* (basic)
        const boldItalic = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-sm">$1</code>')

        // Convert newlines to <br> but preserve paragraph spacing
        const html = boldItalic
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/^(.+)$/, '<p>$1</p>')

        return <span dangerouslySetInnerHTML={{ __html: html }} />
    }

    const onSend = async () => {
        const text = input.trim()
        if (!text) return
        setSending(true)

    const userMsg: Message = { id: uuidv4(), text, role: 'user', time: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        setInput("")

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput: text }),
            })

            if (!res.ok) {
                const body = await res.text()
                const errMsg = body || `${res.status} ${res.statusText}`
                setMessages(prev => [...prev, { id: uuidv4(), text: `Error: ${errMsg}`, role: 'assistant', time: new Date().toISOString() }])
                return
            }

            const json = await res.json()
            // Try common fields returned by your API; fall back to a JSON string
            let assistantText = ''
            if (json?.reply) {
                assistantText = String(json.reply)
            } else if (json?.runStatus?.data && Array.isArray(json.runStatus.data) && json.runStatus.data[0]?.output?.content) {
                assistantText = String(json.runStatus.data[0].output.content)
            } else if (json?.runStatus?.data && Array.isArray(json.runStatus.data) && json.runStatus.data[0]?.output) {
                assistantText = JSON.stringify(json.runStatus.data[0].output, null, 2)
            } else if (json?.content) {
                assistantText = String(json.content)
            } else if (json?.message) {
                assistantText = String(json.message)
            } else {
                assistantText = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
            }

            setMessages(prev => [...prev, { id: uuidv4(), text: assistantText, role: 'assistant', time: new Date().toISOString() }])
        } catch (err: any) {
            setMessages(prev => [...prev, { id: uuidv4(), text: `Network error: ${err?.message ?? String(err)}`, role: 'assistant', time: new Date().toISOString() }])
        } finally {
            setSending(false)
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    return (
        <div className="min-h-screen bg-dark p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">AI Career Chat</h1>
                        <p className="text-gray-400">Ask about resumes, interviews, or career growth — get tailored suggestions.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto items-center justify-center flex">
                <Card className="h-[75vh] w-3/4 flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-xl">Career Counsellor</span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                        <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-2">
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : m.role === 'system' ? 'bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'} px-4 py-3 rounded-lg shadow-sm max-w-[85%] break-words`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden">
                                            {renderMessageContent(m.text)}
                                        </div>
                                        <div className="text-xs mt-2 text-right opacity-60">{m.time}</div>
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="flex justify-start mb-4">
                                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-lg shadow-sm flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <div className="text-sm text-slate-700 dark:text-slate-200">AI is typing...</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 p-4 border-t dark:border-slate-700">
                            <div className="flex gap-3 items-end">
                                <Textarea
                                    aria-label="Type your message"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    rows={2}
                                    className="flex-1 resize-none"
                                    placeholder="Ask something like: 'How do I tailor my resume for a product manager role?'"
                                />

                                <div className="flex items-center">
                                    <Button onClick={onSend} disabled={sending || input.trim().length === 0} className="bg-blue-600 hover:bg-blue-700">
                                        <Send className="w-4 h-4 mr-2" />
                                        {sending ? 'Sending...' : 'Send'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}