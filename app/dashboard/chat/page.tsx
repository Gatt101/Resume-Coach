"use client"

import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send, MessageSquare, Loader2, Search, Crown, Zap, CheckCircle, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import HeroBackdrop from '@/components/HeroBackdrop'
import Link from "next/link"

interface Message {
    id: string
    text: string
    role: "user" | "assistant" | "system"
    time?: string
}

interface ChatSession 
{
  id: string;
  name?: string;
  messages?: Message[];
  updatedAt?: string;
}

export default function ChatPage() {
    const router = useRouter()
    const { user } = useUser()
    const [messages, setMessages] = useState<Message[]>([])
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [sessionSearch, setSessionSearch] = useState("")
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const [chatSessionId, setChatSessionId] = useState<string>(() => uuidv4())
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)
    const [subscriptionLoading, setSubscriptionLoading] = useState(true)
    const listRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        async function checkSubscription() {
            if (!user) return
            
            try {
                // Check subscription status via API
                const response = await fetch('/api/subscription/status')
                if (response.ok) {
                    const data = await response.json()
                    setIsSubscribed(data.isSubscribed)
                } else {
                    // Fallback to client-side check
                    const hasSubscription = user.publicMetadata?.subscription === 'plus' || 
                                          user.publicMetadata?.plan === 'plus' ||
                                          user.publicMetadata?.hasActiveSubscription === true
                    setIsSubscribed(hasSubscription)
                }
            } catch (error) {
                console.error("Failed to check subscription", error)
                // Fallback to client-side check
                const hasSubscription = user.publicMetadata?.subscription === 'plus' || 
                                      user.publicMetadata?.plan === 'plus' ||
                                      user.publicMetadata?.hasActiveSubscription === true
                setIsSubscribed(hasSubscription)
            } finally {
                setSubscriptionLoading(false)
            }
        }
        
        checkSubscription()
        
        // Set up interval to check subscription status periodically
        const interval = setInterval(checkSubscription, 30000) // Check every 30 seconds
        
        return () => clearInterval(interval)
    }, [user])

    useEffect(() => {
        async function fetchChatSessions() {
            if (!isSubscribed) return
            
            setSessionsLoading(true)
            try {
                const response = await fetch("/api/user/chat")
                if (response.ok) {
                    const data = await response.json()
                    const sessions: ChatSession[] = data?.sessions ?? data ?? []
                    setChatSessions(sessions)
                }
            } catch (error) {
                console.error("Failed to fetch chat sessions", error)
            } finally {
                setSessionsLoading(false)
            }
        }
        fetchChatSessions()
    }, [isSubscribed])
    
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (messages.length > 0) {
                try {
                    const response = await fetch('/api/chat/save', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            messages,
                            chatSessionId 
                        }),
                    })
                    
                    if (response.ok) {
                        const data = await response.json()
                        console.log('Chat saved successfully:', data)
                    } else {
                        const body = await response.text()
                        console.error('[chat/save] server error:', response.status, body)
                    }
                } catch (error) {
                    console.log('Failed to save chat:', error)
                }
            }
        }, 1000)

        return () => clearTimeout(timeoutId)
    }, [messages, chatSessionId])

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    }, [messages])

    function pushMessage(message: Message) {
        setMessages((m) => [...m, message])
    }

    const loadChatSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/user/chat?sessionId=${sessionId}`)
            if (response.ok) {
                const data = await response.json()
                const messagesFromServer: Message[] = data?.messages ?? data?.session?.messages ?? data ?? []
                setMessages(messagesFromServer)
                setSelectedSession(sessionId)
                setChatSessionId(sessionId)
            }
        } catch (error) {
            console.error("Failed to load chat session", error)
        }
    }

    const newChat = () => {
        const id = uuidv4()
        setSelectedSession(null)
        setChatSessionId(id)
        setMessages([])
    }

    function renderMessageContent(text: string) {
        if (!text) return null

        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(text)
                if (parsed.content) {
                    text = parsed.content
                }
            } catch (e) {}
        }

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
        const boldItalic = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-sm">$1</code>')

        const html = boldItalic
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/^(.+)$/, '<p>$1</p>')

        return <span dangerouslySetInnerHTML={{ __html: html }} />
    }

    function ClientTime({ iso }: { iso?: string | undefined }) {
        const [text, setText] = useState('')

        useEffect(() => {
            if (!iso) return
            try {
                const d = new Date(iso)
                const formatted = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })
                setText(formatted.replace(/\s?(am|pm)$/i, (m) => m.toUpperCase()))
            } catch (e) {
                setText('')
            }
        }, [iso])

        if (!text) return <div className="text-xs mt-2 text-right opacity-60">&nbsp;</div>
        return <div className="text-xs mt-2 text-right opacity-60">{text}</div>
    }

    const onSend = async () => {
        const text = input.trim()
        if (!text) return
        
        // Check subscription before sending
        if (!isSubscribed) {
            setMessages(prev => [...prev, { 
                id: uuidv4(), 
                text: "🚫 This feature requires a Plus subscription. Please upgrade to access AI Career Chat.", 
                role: 'assistant', 
                time: new Date().toISOString() 
            }])
            return
        }
        
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

    function sessionPreview(session: ChatSession) {
        const last = session.messages && session.messages.length ? session.messages[0] : undefined
        return last ? (last.text.length > 80 ? last.text.slice(0, 77) + '...' : last.text) : session.name ?? 'New chat'
    }

    function formatTime(iso?: string) {
        if (!iso) return ''
        try {
            const d = new Date(iso)
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        } catch { return '' }
    }

    // Subscription Screen Component
    const SubscriptionScreen = () => (
        <div className="w-full">
            <Card className="min-h-[80vh] w-full flex flex-col bg-transparent border-0 rounded-lg">
                <CardHeader className="flex-shrink-0 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                            <Crown className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">Unlock AI Career Chat</CardTitle>
                    <p className="text-gray-400 text-lg">Get personalized career advice from our AI assistant</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="max-w-none w-full mx-auto text-center space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-white mb-6">What you'll get with Plus:</h3>
                            
                            <div className="grid gap-4 text-left">
                                <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                                    <div className="p-2 bg-green-600 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">Unlimited AI Career Chat</h4>
                                        <p className="text-gray-400 text-sm">Ask unlimited questions about resumes, interviews, and career growth</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">Advanced Resume Analysis</h4>
                                        <p className="text-gray-400 text-sm">Get detailed feedback and optimization suggestions</p>
                                    </div>
                                </div>
                                
                                 <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                                     <div className="p-2 bg-purple-600 rounded-lg">
                                         <Star className="w-5 h-5 text-white" />
                                     </div>
                                     <div>
                                         <h4 className="font-semibold text-white">Priority Support</h4>
                                         <p className="text-gray-400 text-sm">Get faster responses and priority customer support</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         
                         <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
                             <h4 className="text-xl font-semibold text-white mb-2">Ready to accelerate your career?</h4>
                             <p className="text-gray-300 mb-4">Join thousands of professionals who've transformed their careers with AI-powered insights.</p>
                             
                             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <h2>Steps to Purchase:</h2>
                                <p>1.  Go back to dashboard</p>
                                <p>2. Click on Your Account logo</p>
                                <p>3. In the Settings Go to billing Section!</p>
                             </div>
                         </div>
                        
                        <div className="text-sm text-gray-500">
                            <p>✨ 7-day free trial • Cancel anytime • No hidden fees</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    // Show loading screen while checking subscription
    if (subscriptionLoading) {
        return (
            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background px-4 sm:px-6 py-6 text-white">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl" />
                </div>
                <div className="max-w-6xl mx-auto flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                        <p className="text-gray-400">Loading chat...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show subscription screen for non-subscribed users
    if (!isSubscribed) {
        return (
            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background px-4 sm:px-6 py-6 text-white">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl" />
                </div>
                
                <div className="w-full">
                    <main className="w-full">
                        <HeroBackdrop className="w-full min-h-[75vh]">
                            <div className="flex items-center gap-4 mb-6">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => router.push('/dashboard')}
                                    className="border-gray-600 text-white hover:bg-gray-700"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold">AI Career Chat</h1>
                                        <p className="text-gray-400">Premium feature - Upgrade to Plus for unlimited access</p>
                                    </div>
                                </div>
                            </div>
                            <SubscriptionScreen />
                        </HeroBackdrop>
                    </main>
                </div>
            </div>
        )
    }

    // Show full chat interface for subscribed users
    return (
        <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background p-6 text-white">
            {/* Decorative background matching dashboard hero */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl" />
            </div>

            <div className="w-full mx-auto flex gap-6">
                <aside className="w-80 bg-black/20 border-r border-border/30 p-4 flex flex-col rounded-lg backdrop-blur">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Chat History</h2>
                    <Button 
                        size="sm" 
                        onClick={newChat}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        + New Chat
                    </Button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                            {sessionsLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        </div>
                    ) : chatSessions.length === 0 ? (
                        <div className="text-sm text-center text-gray-400 py-6">
                            No chats found. Start a new conversation!
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {chatSessions
                                .filter(s => !sessionSearch || 
                                    (s.name || '').toLowerCase().includes(sessionSearch.toLowerCase()) || 
                                    sessionPreview(s).toLowerCase().includes(sessionSearch.toLowerCase()))
                                .sort((a, b) => (b.updatedAt || '') > (a.updatedAt || '') ? 1 : -1)
                                .map((session) => (
                                    <li key={session.id}>
                                        <button
                                            onClick={() => loadChatSession(session.id)}
                                            className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                                                selectedSession === session.id 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'hover:bg-gray-700 text-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium truncate max-w-[200px]">
                                                    {session.name ?? sessionPreview(session)}
                                                </div>
                                                <div className="text-xs opacity-60">
                                                    {formatTime(session.updatedAt)}
                                                </div>
                                            </div>
                                            <div className="text-sm opacity-75 truncate">
                                                {sessionPreview(session)}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            </aside>

                <main className="flex-1">
                    <HeroBackdrop className="w-full">
                <div className="flex items-center gap-4 mb-6">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.push('/dashboard')}
                        className="border-gray-600 text-white hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">AI Career Chat</h1>
                            <p className="text-gray-400">Ask about resumes, interviews, or career growth — get tailored suggestions.</p>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <Card className="h-[75vh] w-full flex flex-col bg-transparent border-0 rounded-lg">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-xl">Career Counsellor</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                            <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-2">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-400 py-10">
                                        Start a conversation by typing a message below.
                                    </div>
                                )}
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                                            <div className={`$${
                                                m.role === 'user' 
                                                    ? 'bg-green-600 text-white' 
                                                    : m.role === 'system' 
                                                    ? 'bg-black/30 text-gray-200' 
                                                    : 'bg-black/40 text-gray-100'
                                            } px-4 py-3 rounded-lg shadow-sm max-w-[85%] break-words`}>
                                            <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden">
                                                {renderMessageContent(m.text)}
                                            </div>
                                            <ClientTime iso={m.time} />
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start mb-4">
                                        <div className="bg-gray-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-3">
                                            <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                            <div className="text-sm text-gray-200">AI is typing...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 p-4 border-t border-gray-700">
                                <div className="flex gap-3 items-end">
                                    <Textarea
                                        aria-label="Type your message"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={onKeyDown}
                                        rows={2}
                                        className="flex-1 resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                                        placeholder="Ask something like: 'How do I tailor my resume for a product manager role?'"
                                    />
                                    <Button 
                                        onClick={onSend} 
                                        disabled={sending || input.trim().length === 0} 
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {sending ? 'Sending...' : 'Send'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                    </HeroBackdrop>
            </main>
            </div>
        </div>
    )
}