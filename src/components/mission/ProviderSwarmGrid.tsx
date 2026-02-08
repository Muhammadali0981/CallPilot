import { CallStatus, ProviderCall } from '@/lib/types';
import { t } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Phone, PhoneCall, PhoneOff, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<CallStatus, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'bg-muted', icon: <Clock className="h-4 w-4" />, label: 'Pending' },
  ringing: { color: 'bg-yellow-500/20 text-yellow-500', icon: <Phone className="h-4 w-4 animate-pulse" />, label: 'Ringing' },
  'in-progress': { color: 'bg-blue-500/20 text-blue-500', icon: <PhoneCall className="h-4 w-4 animate-pulse" />, label: 'In Progress' },
  complete: { color: 'bg-green-500/20 text-green-500', icon: <CheckCircle2 className="h-4 w-4" />, label: 'Complete' },
  failed: { color: 'bg-destructive/20 text-destructive', icon: <XCircle className="h-4 w-4" />, label: 'Failed' },
  'no-answer': { color: 'bg-muted text-muted-foreground', icon: <PhoneOff className="h-4 w-4" />, label: 'No Answer' },
};

interface Props {
  calls: ProviderCall[];
  selectedCallId: string | null;
  onSelectCall: (id: string) => void;
  language: Language;
}

export function ProviderSwarmGrid({ calls, selectedCallId, onSelectCall, language }: Props) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('mission.swarm', language)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <AnimatePresence>
            {calls.map((call) => {
              const cfg = statusConfig[call.status];
              return (
                <motion.button
                  key={call.provider.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => onSelectCall(call.provider.id)}
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
  );
}
