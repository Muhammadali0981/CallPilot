import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Category, BookingRequest, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Rocket, Stethoscope, Car, Scissors, Home, Dumbbell, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categories: { value: Category; icon: React.ReactNode; key: string }[] = [
  { value: 'medical', icon: <Stethoscope className="h-5 w-5" />, key: 'category.medical' },
  { value: 'auto', icon: <Car className="h-5 w-5" />, key: 'category.auto' },
  { value: 'beauty', icon: <Scissors className="h-5 w-5" />, key: 'category.beauty' },
  { value: 'home', icon: <Home className="h-5 w-5" />, key: 'category.home' },
  { value: 'fitness', icon: <Dumbbell className="h-5 w-5" />, key: 'category.fitness' },
  { value: 'legal', icon: <Scale className="h-5 w-5" />, key: 'category.legal' },
];

export default function NewRequestPage() {
  const { language, setPage, setCurrentRequest } = useAppStore();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('medical');
  const [location, setLocation] = useState('San Francisco');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [weights, setWeights] = useState({ availability: 50, rating: 30, distance: 20 });

  const handleLaunch = () => {
    if (!description.trim()) {
      toast.error('Please describe what you need');
      return;
    }
    const userAvailability: TimeSlot[] = selectedDates.map(d => {
      const day = d.toISOString().split('T')[0];
      return { day, start: '08:00', end: '18:00' };
    });

    const request: BookingRequest = {
      id: crypto.randomUUID(),
      description,
      category,
      location,
      userAvailability,
      weights,
      language,
      createdAt: Date.now(),
    };
    setCurrentRequest(request);
    setPage('mission-control');
    toast.success('CallPilot launched! Initiating calls...');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold">{t('request.title', language)}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Description */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('request.describe', language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t('request.describePlaceholder', language)}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('request.category', language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {categories.map(({ value, icon, key }) => (
                  <button
                    key={value}
                    onClick={() => setCategory(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all ${
                      category === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {icon}
                    {t(key, language)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('request.location', language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={t('request.locationPlaceholder', language)}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('request.preferences', language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t('request.prefAvailability', language)}</Label>
                  <span className="text-muted-foreground">{weights.availability}%</span>
                </div>
                <Slider
                  value={[weights.availability]}
                  onValueChange={([v]) => setWeights({ ...weights, availability: v })}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t('request.prefRating', language)}</Label>
                  <span className="text-muted-foreground">{weights.rating}%</span>
                </div>
                <Slider
                  value={[weights.rating]}
                  onValueChange={([v]) => setWeights({ ...weights, rating: v })}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t('request.prefDistance', language)}</Label>
                  <span className="text-muted-foreground">{weights.distance}%</span>
                </div>
                <Slider
                  value={[weights.distance]}
                  onValueChange={([v]) => setWeights({ ...weights, distance: v })}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Calendar */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('request.availability', language)}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {selectedDates.length > 0 && (
            <Card className="glass">
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">Selected dates:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((d, i) => (
                    <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Launch */}
          <Button
            size="lg"
            onClick={handleLaunch}
            className="w-full glow-primary text-base gradient-primary border-0"
          >
            <Rocket className="mr-2 h-5 w-5" />
            {t('request.launch', language)}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
