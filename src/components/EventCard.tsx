import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  hostName: string;
  city: string;
  durationHours: number;
  maxPersons: number;
  pricePerPerson: number;
  imageUrl?: string;
  onBook?: () => void;
  language?: 'ar' | 'en';
  t?: any;
}

export function EventCard({
  id,
  title,
  category,
  hostName,
  city,
  durationHours,
  maxPersons,
  pricePerPerson,
  imageUrl,
  onBook,
  language = 'ar',
  t,
}: EventCardProps) {
  const isRTL = language === 'ar';
  const defaultImage = 'https://images.unsplash.com/photo-1593671186131-d58817e7dee0?w=800';
  return (
    <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative h-56 overflow-hidden">
        <ImageWithFallback
          src={imageUrl || defaultImage}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} bg-accent hover:bg-accent text-white`}>
          {category}
        </Badge>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl mb-2 text-[#3F2A22]">{title}</h3>
        
        <p className="text-sm text-muted-foreground mb-5">
          {isRTL ? 'مقدّم التجربة: ' : 'Host: '}{hostName}
        </p>

        <div className="space-y-3 mb-6 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {durationHours} {isRTL 
                ? (durationHours === 1 ? 'ساعة' : 'ساعات')
                : (durationHours === 1 ? 'hour' : 'hours')
              }
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>
              {isRTL ? 'حتى ' : 'Up to '}{maxPersons}{' '}
              {isRTL 
                ? (maxPersons > 10 ? 'شخصًا' : 'أشخاص')
                : (maxPersons === 1 ? 'person' : 'people')
              }
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-5 border-t mt-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl text-[#3F2A22]">{pricePerPerson}</span>
            <span className="text-sm text-muted-foreground">{isRTL ? 'ريال' : 'SAR'}</span>
          </div>
          <Button
            onClick={() => onBook?.()}
            className="bg-[#860A33] hover:bg-[#860A33]/90 text-white"
          >
            {t?.bookNow || 'احجز الآن'}
          </Button>
        </div>
      </div>
    </div>
  );
}