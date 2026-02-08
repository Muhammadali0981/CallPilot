import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, ArrowRight, Calendar, Star, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { language, setPage, bookings, calls } = useAppStore();
  const activeCalls = calls.filter(c => c.status === 'ringing' || c.status === 'in-progress');

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-8 sm:p-12"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-sm text-primary-foreground/90 backdrop-blur-sm">
            <Phone className="h-4 w-4" />
            <span>{t('app.tagline', language)}</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-5xl">
            {t('dashboard.hero.title', language)}
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/80">
            {t('dashboard.hero.subtitle', language)}
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setPage('new-request')}
            className="group text-base"
          >
            {t('dashboard.cta', language)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-background/5" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-background/5" />
      </motion.section>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.recent', language)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCalls.length}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.active', language)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent bookings */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('dashboard.recent', language)}</h2>
        {bookings.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">{t('dashboard.noBookings', language)}</p>
              <Button variant="link" onClick={() => setPage('new-request')} className="mt-2">
                {t('dashboard.cta', language)} →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bookings.slice(0, 5).map((booking) => (
              <Card key={booking.id} className="glass">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.slot.day} at {booking.slot.start}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    {booking.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
