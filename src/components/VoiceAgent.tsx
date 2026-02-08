import { useConversation } from '@elevenlabs/react';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

export function VoiceAgent() {
  const { agentId, setAgentId, setVoiceConnected, setIsSpeaking } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      setVoiceConnected(true);
      toast.success('Voice agent connected');
    },
    onDisconnect: () => {
      setVoiceConnected(false);
      setIsSpeaking(false);
    },
    onMessage: (message) => {
      console.log('ElevenLabs message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast.error('Voice agent error. Check console.');
      setVoiceConnected(false);
    },
  });

  const isSpeakingNow = conversation.isSpeaking;

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      toast.error('Please enter your ElevenLabs Agent ID');
      return;
    }
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: agentId.trim(),
        connectionType: 'websocket',
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      toast.error('Failed to connect. Check your Agent ID and microphone permissions.');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setVoiceConnected(false);
    toast.info('Voice agent disconnected');
  }, [conversation]);

  const isConnected = conversation.status === 'connected';

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Voice Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="ElevenLabs Agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="text-xs"
          disabled={isConnected}
        />

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
            {isConnected ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            {isConnected
              ? isSpeakingNow ? '🗣️ Agent speaking...' : '🎧 Listening...'
              : 'Disconnected'}
          </div>
        </div>

        {isConnected ? (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={stopConversation}
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Voice Session
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full gradient-primary border-0"
            onClick={startConversation}
            disabled={isConnecting || !agentId.trim()}
          >
            {isConnecting ? (
              <>Connecting...</>
            ) : (
              <>
                <PhoneCall className="mr-2 h-4 w-4" />
                Start Voice Agent
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Enter your ElevenLabs agent ID to enable live voice interaction with the AI agent.
        </p>
      </CardContent>
    </Card>
  );
}
