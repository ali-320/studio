
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: { seconds: number; nanoseconds: number } | null;
}

export function VolunteerChat() {
    const { firestore, user } = useFirebase();
    const { profile } = useUserProfile();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!firestore) return;

        const q = query(collection(firestore, 'volunteerChats'), orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach(doc => {
                msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(msgs.reverse());
        }, (error) => {
            console.error("Chat snapshot error:", error);
            const permissionError = new FirestorePermissionError({
                path: 'volunteerChats',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribe();
    }, [firestore]);
    
    useEffect(() => {
        // Auto-scroll to bottom
        setTimeout(() => {
             if (scrollAreaRef.current) {
                const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTop = viewport.scrollHeight;
                }
            }
        }, 100);
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !profile || newMessage.trim() === '') return;

        const messageData = {
            userId: user.uid,
            userName: profile.name,
            text: newMessage.trim(),
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, 'volunteerChats'), messageData);
            setNewMessage('');
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: 'volunteerChats',
                operation: 'create',
                requestResourceData: { text: newMessage.trim() }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Send Failed', description: 'You do not have permission to send messages.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Volunteer Chat</CardTitle>
                <CardDescription>Real-time coordination channel</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px] p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.userId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-xs font-semibold opacity-80">{msg.userName}</p>
                                    <p>{msg.text}</p>
                                    {msg.timestamp && (
                                        <p className="text-xs opacity-60 text-right mt-1">
                                            {formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4">
                 <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
