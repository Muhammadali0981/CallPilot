import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { searchProviders } from '@/lib/providers';
import { simulateCallSequence } from '@/lib/simulation';
import { scoreProviders } from '@/lib/scoring';
import { CallStatus, ProviderCall, TranscriptEntry, TimeSlot } from '@/lib/types';
import { VoiceAgent } from '@/components/VoiceAgent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Phone, PhoneCall, PhoneOff, CheckCircle2, XCircle, Clock,
  Send, Wrench, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig: Record<CallStatus, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'bg-muted', icon: <Clock className="h-4 w-4" />, label: 'Pending' },
  ringing: { color: 'bg-yellow-500/20 text-yellow-500', icon: <Phone className="h-4 w-4 animate-pulse" />, label: 'Ringing' },
  'in-progress': { color: 'bg-blue-500/20 text-blue-500', icon: <PhoneCall className="h-4 w-4 animate-pulse" />, label: 'In Progress' },
  complete: { color: 'bg-green-500/20 text-green-500', icon: <CheckCircle2 className="h-4 w-4" />, label: 'Complete' },
  failed: { color: 'bg-destructive/20 text-destructive', icon: <XCircle className="h-4 w-4" />, label: 'Failed' },
  'no-answer': { color: 'bg-muted text-muted-foreground', icon: <PhoneOff className="h-4 w-4" />, label: 'No Answer' },
};

export default function MissionControlPage() {
  const {
    language, currentRequest, calls, setCalls, updateCall, addTranscript,
    setResults, setPage,
  } = useAppStore();

  const [overrideText, setOverrideText] = useState('');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [toolEvents, setToolEvents] = useState<string[]>([]);
  const cleanupRef = useRef<(() => void)[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const completedSlotsRef = useRef<Map<string, TimeSlot[]>>(new Map());

  // Start simulation on mount
  useEffect(() => {
    if (!currentRequest) return;
    let cancelled = false;

    (async () => {
      const providers = await searchProviders(currentRequest.category, currentRequest.location);
      if (cancelled) return;
      if (providers.length === 0) {
        toast.error('No providers found for this category and location');
        return;
      }

      const initialCalls: ProviderCall[] = providers.map(p => ({
        provider: p,
        status: 'pending',
        offeredSlots: [],
        transcript: [],
      }));
      setCalls(initialCalls);
      setSelectedCallId(providers[0].id);
      completedSlotsRef.current = new Map();

      // Launch simulated calls
      const cleanups = providers.map(provider => {
        return simulateCallSequence(
          provider,
          (status) => {
            updateCall(provider.id, { status });
            if (status === 'ringing') {
              setToolEvents(prev => [...prev, `📞 Dialing ${provider.name}...`]);
            }
            if (status === 'in-progress') {
              setToolEvents(prev => [...prev, `🔗 Connected to ${provider.name}`]);
            }
          },
          (entry) => {
            addTranscript(provider.id, entry);
            if (entry.role === 'agent') {
              setToolEvents(prev => [...prev, `🤖 Agent querying ${provider.name}`]);
            }
          },
          (offeredSlots) => {
            updateCall(provider.id, { offeredSlots, endedAt: Date.now() });
            completedSlotsRef.current.set(provider.id, offeredSlots);

            if (offeredSlots.length > 0) {
              setToolEvents(prev => [...prev, `✅ ${provider.name}: ${offeredSlots.length} slot(s) found`]);
            } else {
              setToolEvents(prev => [...prev, `❌ ${provider.name}: No availability`]);
            }
          },
        );
      });
      cleanupRef.current = cleanups;
    })();

    return () => {
      cancelled = true;
      cleanupRef.current.forEach(fn => fn());
    };
  }, [currentRequest]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [calls]);

  // Check if all calls done
  const allDone = calls.length > 0 && calls.every(c =>
    c.status === 'complete' || c.status === 'failed' || c.status === 'no-answer'
  );

  const handleViewResults = () => {
    if (!currentRequest) return;
    const providerSlots: { provider: typeof calls[0]['provider']; slot: TimeSlot }[] = [];
    calls.forEach(c => {
      c.offeredSlots.forEach(slot => {
        providerSlots.push({ provider: c.provider, slot });
      });
    });
    const scored = scoreProviders(providerSlots, currentRequest.weights, currentRequest.userAvailability);
    setResults(scored);
    setPage('results');
  };

  const handleSendOverride = () => {
    if (!overrideText.trim() || !selectedCallId) return;
    addTranscript(selectedCallId, {
      role: 'user',
      text: overrideText,
      timestamp: Date.now(),
    });
    setOverrideText('');
    toast.info('Override sent to agent');
  };

  const selectedCall = calls.find(c => c.provider.id === selectedCallId);
  const progress = calls.length > 0
    ? Math.round((calls.filter(c => c.status === 'complete' || c.status === 'failed' || c.status === 'no-answer').length / calls.length) * 100)
    : 0;

  if (!currentRequest) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="text-lg text-muted-foreground">No active request. Start a new booking first.</p>
        <Button variant="link" onClick={() => setPage('new-request')} className="mt-2">
          {t('dashboard.cta', language)} →
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('mission.title', language)}</h1>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="w-32" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
          {allDone && (
            <Button onClick={handleViewResults} className="gradient-primary border-0 glow-primary">
              View Results →
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Provider Swarm Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('mission.swarm', language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                <AnimatePresence>
                  {calls.map((call) => {
                    const cfg = statusConfig[call.status];
                    return (
                      <motion.button
                        key={call.provider.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedCallId(call.provider.id)}
                        className={`relative rounded-xl border p-3 text-left transition-all ${
                          selectedCallId === call.provider.id
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-xs font-semibold truncate">{call.provider.name}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <span>★ {call.provider.rating}</span>
                          <span>·</span>
                          <span>{call.provider.distance}mi</span>
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {t(`status.${call.status}`, language)}
                        </div>
                        {call.status === 'in-progress' && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('mission.transcript', language)}</CardTitle>
                {selectedCall && (
                  <Badge variant="outline">{selectedCall.provider.name}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded-lg bg-secondary/30 p-4">
                {selectedCall?.transcript.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: entry.role === 'agent' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`mb-3 flex ${entry.role === 'agent' || entry.role === 'user' ? 'justify-end' : entry.role === 'system' ? 'justify-center' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      entry.role === 'agent' ? 'bg-primary text-primary-foreground' :
                      entry.role === 'receptionist' ? 'bg-secondary text-secondary-foreground' :
                      entry.role === 'user' ? 'bg-accent text-accent-foreground' :
                      'bg-muted text-muted-foreground text-xs italic'
                    }`}>
                      <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                        {entry.role === 'agent' ? '🤖 Agent' :
                         entry.role === 'receptionist' ? '📞 Receptionist' :
                         entry.role === 'user' ? '👤 You' : '⚙️ System'}
                      </p>
                      {entry.text}
                    </div>
                  </motion.div>
                ))}
                {(!selectedCall || selectedCall.transcript.length === 0) && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Select a provider to view transcript
                  </p>
                )}
                <div ref={transcriptEndRef} />
              </ScrollArea>

              {/* Override input */}
              <div className="mt-3 flex gap-2">
                <Input
                  value={overrideText}
                  onChange={(e) => setOverrideText(e.target.value)}
                  placeholder={t('mission.sendMessage', language)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOverride()}
                />
                <Button size="icon" onClick={handleSendOverride}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <VoiceAgent />

          {/* Tool Events */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {t('mission.tools', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {toolEvents.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-1.5 text-xs text-muted-foreground"
                  >
                    {event}
                  </motion.div>
                ))}
                {toolEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-4">
                    Waiting for calls to start...
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Request info */}
          <Card className="glass">
            <CardContent className="p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Request:</span> {currentRequest.description}</p>
              <p><span className="text-muted-foreground">Category:</span> {t(`category.${currentRequest.category}`, language)}</p>
              <p><span className="text-muted-foreground">Location:</span> {currentRequest.location}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
