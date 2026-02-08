import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Booking, ScoredResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, MapPin, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const barColors = ['hsl(245, 58%, 61%)', 'hsl(200, 80%, 55%)', 'hsl(152, 60%, 45%)', 'hsl(38, 92%, 50%)'];

export default function ResultsPage() {
  const { language, results, setPage, addBooking, currentRequest } = useAppStore();

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">No results yet. Run a search first.</p>
        <Button variant="link" onClick={() => setPage('new-request')} className="mt-2">
          Start new request →
        </Button>
      </div>
    );
  }

  const chartData = results.slice(0, 6).map(r => ({
    name: r.provider.name.length > 15 ? r.provider.name.slice(0, 15) + '…' : r.provider.name,
    score: r.scores.total,
    availability: r.scores.availability,
    rating: r.scores.rating,
    distance: r.scores.distance,
  }));

  const handleConfirm = (result: ScoredResult) => {
    if (!currentRequest) return;
    const booking: Booking = {
      id: crypto.randomUUID(),
      request: currentRequest,
      provider: result.provider,
      slot: result.slot,
      confirmedAt: Date.now(),
      status: 'confirmed',
    };
    addBooking(booking);
    toast.success(t('results.booked', language));
    setPage('dashboard');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('results.title', language)}</h1>
        <Button variant="ghost" onClick={() => setPage('mission-control')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mission Control
        </Button>
      </div>

      {/* Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(228, 18%, 10%)',
                  border: '1px solid hsl(228, 15%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Results list */}
      <div className="space-y-3">
        {results.map((result, i) => (
          <motion.div
            key={`${result.provider.id}-${result.slot.day}-${result.slot.start}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`glass ${i === 0 ? 'ring-2 ring-primary/30 glow-primary' : ''}`}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {i === 0 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shrink-0">
                      <Trophy className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  {i > 0 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0">
                      <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{result.provider.name}</p>
                      {i === 0 && (
                        <Badge className="gradient-primary border-0 text-primary-foreground text-[10px]">
                          {t('results.recommended', language)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.slot.day} at {result.slot.start}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {result.provider.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {result.provider.distance}mi
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Score pills */}
                  <div className="flex gap-1.5">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {t('results.score', language)}: {result.scores.total}
                    </span>
                    <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
                      A:{result.scores.availability}
                    </span>
                    <span className="rounded-md bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                      R:{result.scores.rating}
                    </span>
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">
                      D:{result.scores.distance}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleConfirm(result)}
                    className={i === 0 ? 'gradient-primary border-0 glow-primary' : ''}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t('results.confirm', language)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
