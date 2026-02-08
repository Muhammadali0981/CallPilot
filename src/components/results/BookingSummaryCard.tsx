import { Booking } from '@/lib/types';
import { t } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Phone, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  booking: Booking;
  language: Language;
}

export function BookingSummaryCard({ booking, language }: Props) {
  const summaryText = [
    `📅 Appointment Confirmed`,
    `Provider: ${booking.provider.name}`,
    `Category: ${booking.request.category}`,
    `Date: ${booking.slot.day} at ${booking.slot.start} - ${booking.slot.end}`,
    `Address: ${booking.provider.address}, ${booking.provider.city} ${booking.provider.zip}`,
    `Phone: ${booking.provider.phone}`,
    `Rating: ${booking.provider.rating}/5`,
    ``,
    `Booked via CallPilot`,
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    toast.success('Copied to clipboard!');
  };

  const handleExport = () => {
    // Create ICS calendar event
    const startDate = new Date(`${booking.slot.day}T${booking.slot.start}:00`);
    const endDate = new Date(`${booking.slot.day}T${booking.slot.end}:00`);
    const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CallPilot//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICS(startDate)}`,
      `DTEND:${formatICS(endDate)}`,
      `SUMMARY:Appointment at ${booking.provider.name}`,
      `LOCATION:${booking.provider.address}, ${booking.provider.city} ${booking.provider.zip}`,
      `DESCRIPTION:${booking.request.description}\\nPhone: ${booking.provider.phone}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `callpilot-booking-${booking.slot.day}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendar file downloaded!');
  };

  return (
    <Card className="glass ring-2 ring-green-500/30 glow-success">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            ✅ Booking Confirmed
          </CardTitle>
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{booking.slot.day}</p>
              <p className="text-xs text-muted-foreground">{booking.slot.start} - {booking.slot.end}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{booking.provider.name}</p>
              <p className="text-xs text-muted-foreground">Rating: {booking.provider.rating}/5</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{booking.provider.address}</p>
              <p className="text-xs text-muted-foreground">{booking.provider.city} {booking.provider.zip}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{booking.provider.phone}</p>
              <p className="text-xs text-muted-foreground">{booking.request.description}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="mr-1 h-3 w-3" />
            Copy Details
          </Button>
          <Button size="sm" onClick={handleExport} className="flex-1 gradient-primary border-0">
            <Download className="mr-1 h-3 w-3" />
            Export to Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
