import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { searchProviders } from '@/lib/providers';
import { simulateCallSequence } from '@/lib/simulation';
import { scoreProviders } from '@/lib/scoring';
import { ProviderCall, TimeSlot } from '@/lib/types';
import { VoiceAgent } from '@/components/VoiceAgent';
import { ProviderSwarmGrid } from '@/components/mission/ProviderSwarmGrid';
import { TranscriptPanel } from '@/components/mission/TranscriptPanel';
import { ToolEventsPanel } from '@/components/mission/ToolEventsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MissionControlPage() {
  const {
    language, currentRequest, calls, setCalls, updateCall, addTranscript,
    setResults, setPage, missionStarted, setMissionStarted,
  } = useAppStore();

  const [overrideText, setOverrideText] = useState('');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [toolEvents, setToolEvents] = useState<string[]>([]);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const cleanupRef = useRef<(() => void)[]>([]);

  // Start simulation on mount — only once per request
  useEffect(() => {
    if (!currentRequest || missionStarted) return;
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
      setMissionStarted(true);
      setSelectedCallId(providers[0].id);

      // Launch AI-powered simulated calls
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
            if (offeredSlots.length > 0) {
              setToolEvents(prev => [...prev, `✅ ${provider.name}: ${offeredSlots.length} slot(s) found`]);
            } else {
              setToolEvents(prev => [...prev, `❌ ${provider.name}: No availability`]);
            }
          },
          currentRequest.description,
          currentRequest.userAvailability,
        );
      });
      cleanupRef.current = cleanups;
    })();

    return () => {
      cancelled = true;
      cleanupRef.current.forEach(fn => fn());
    };
  }, [currentRequest, missionStarted]);

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

  const handleTakeOver = () => {
    setIsTakenOver(true);
    // Stop all ongoing simulations
    cleanupRef.current.forEach(fn => fn());
    cleanupRef.current = [];
    setToolEvents(prev => [...prev, `🖐️ User took over — AI agent paused`]);
    toast.success('You are now in manual mode. Type messages directly to providers.');
  };

  const handleResumeAgent = () => {
    setIsTakenOver(false);
    setToolEvents(prev => [...prev, `🤖 AI agent resumed`]);
    toast.info('AI agent resumed');
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
          {/* Take Over / Resume button */}
          {!allDone && (
            isTakenOver ? (
              <Button variant="outline" size="sm" onClick={handleResumeAgent}>
                🤖 Resume Agent
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleTakeOver}>
                <Hand className="mr-1 h-4 w-4" />
                {t('mission.takeover', language)}
              </Button>
            )
          )}
          <Progress value={progress} className="w-32" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
          {allDone && (
            <Button onClick={handleViewResults} className="gradient-primary border-0 glow-primary">
              View Results →
            </Button>
          )}
        </div>
      </div>

      {isTakenOver && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
          🖐️ <strong>Manual Mode</strong> — AI agent is paused. You're speaking directly to providers.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Provider Swarm Grid + Transcript */}
        <div className="lg:col-span-2 space-y-4">
          <ProviderSwarmGrid
            calls={calls}
            selectedCallId={selectedCallId}
            onSelectCall={setSelectedCallId}
            language={language}
          />
          <TranscriptPanel
            selectedCall={selectedCall}
            userAvailability={currentRequest.userAvailability}
            overrideText={overrideText}
            onOverrideChange={setOverrideText}
            onSendOverride={handleSendOverride}
            language={language}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <VoiceAgent />
          <ToolEventsPanel toolEvents={toolEvents} language={language} />

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
