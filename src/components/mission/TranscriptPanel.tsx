import { useRef, useEffect } from 'react';
import { ProviderCall, TimeSlot, Language } from '@/lib/types';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  selectedCall: ProviderCall | undefined;
  userAvailability: TimeSlot[];
  overrideText: string;
  onOverrideChange: (text: string) => void;
  onSendOverride: () => void;
  language: Language;
}

function isConflict(text: string, userAvailability: TimeSlot[]): boolean {
  // Extract day references from transcript text and check against user availability
  const dayPattern = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})\b/i;
  const match = text.match(dayPattern);
  if (!match || userAvailability.length === 0) return false;

  // If user has availability set, check if mentioned day matches
  const monthMap: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const month = monthMap[match[2]];
  const day = match[3].padStart(2, '0');
  const year = new Date().getFullYear();
  const dateStr = `${year}-${month}-${day}`;

  const matchesAvailability = userAvailability.some(slot => slot.day === dateStr);
  return !matchesAvailability; // conflict if NOT in user availability
}

export function TranscriptPanel({ selectedCall, userAvailability, overrideText, onOverrideChange, onSendOverride, language }: Props) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCall?.transcript]);

  return (
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
          {selectedCall?.transcript.map((entry, i) => {
            const hasConflict = entry.role === 'receptionist' && isConflict(entry.text, userAvailability);
            return (
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
                } ${hasConflict ? 'ring-2 ring-warning' : ''}`}>
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                    {entry.role === 'agent' ? '🤖 Agent' :
                     entry.role === 'receptionist' ? '📞 Receptionist' :
                     entry.role === 'user' ? '👤 You' : '⚙️ System'}
                  </p>
                  {entry.text}
                  {hasConflict && (
                    <p className="mt-1 text-[10px] font-semibold text-warning">
                      ⚠️ Conflicts with your availability
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
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
            onChange={(e) => onOverrideChange(e.target.value)}
            placeholder={t('mission.sendMessage', language)}
            onKeyDown={(e) => e.key === 'Enter' && onSendOverride()}
          />
          <Button size="icon" onClick={onSendOverride}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
