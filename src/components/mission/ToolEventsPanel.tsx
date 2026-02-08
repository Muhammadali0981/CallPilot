import { forwardRef } from 'react';
import { Language } from '@/lib/types';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  toolEvents: string[];
  language: Language;
}

export const ToolEventsPanel = forwardRef<HTMLDivElement, Props>(function ToolEventsPanel({ toolEvents, language }, ref) {
  return (
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
  );
});
