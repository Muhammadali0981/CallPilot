import { useState, useEffect } from 'react';
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
import { GoogleCalendarSync } from '@/components/calendar/GoogleCalendarSync';
import { Rocket, Stethoscope, Car, Scissors, Home, Dumbbell, Scale, MapPin, Loader2 } from 'lucide-react';
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

interface NewRequestPageProps {
  providerToken: string | null;
}

export default function NewRequestPage({ providerToken }: NewRequestPageProps) {
  const { language, setPage, setCurrentRequest } = useAppStore();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('medical');
  const [location, setLocation] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [weights, setWeights] = useState({ availability: 50, rating: 30, distance: 20 });

  // Request geolocation on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lon: longitude });
        // Reverse geocode to get city name
        try {
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=88c2c67b83aa4eb89b05d539a4090390`
          );
          if (res.ok) {
            const data = await res.json();
            const props = data.features?.[0]?.properties;
            if (props) {
              setLocation(props.city || props.town || props.county || 'Your Location');
            }
          }
        } catch {
          setLocation('Your Location');
        }
        setIsLocating(false);
        toast.success('Location detected!');
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setIsLocating(false);
        setLocation('San Francisco');
        toast.info('Could not detect location. Please enter it manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLaunch = () => {
    if (!description.trim()) {
      toast.error('Please describe what you need');
      return;
    }
    const userAvailability: TimeSlot[] = selectedDates.map(d => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const day = `${year}-${month}-${dayNum}`;
      return { day, start: '08:00', end: '18:00' };
    });

    const request: BookingRequest = {
      id: crypto.randomUUID(),
      description,
      category,
      location,
      lat: userCoords?.lat,
      lon: userCoords?.lon,
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
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t('request.locationPlaceholder', language)}
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setUserCoords(null); // clear coords if manually typed
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={requestLocation}
                  disabled={isLocating}
                  title="Detect my location"
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </Button>
              </div>
              {userCoords && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Using GPS coordinates ({userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)})
                </p>
              )}
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
          {/* Google Calendar Sync */}
          <GoogleCalendarSync
            providerToken={providerToken}
            onEventsLoaded={setCalendarEvents}
          />

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

          {calendarEvents.length > 0 && (
            <Card className="glass border-primary/20">
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">📅 Upcoming busy times ({calendarEvents.length}):</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {calendarEvents.slice(0, 10).map((evt, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      <span className="font-medium">{evt.summary}</span>
                      <span>—</span>
                      <span>
                        {evt.allDay
                          ? new Date(evt.start).toLocaleDateString()
                          : new Date(evt.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {calendarEvents.length > 10 && (
                    <p className="text-xs text-muted-foreground">...and {calendarEvents.length - 10} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
