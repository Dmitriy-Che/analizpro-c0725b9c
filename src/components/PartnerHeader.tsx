import { Link } from 'react-router-dom';
import defaultLogo from '@/assets/new-logo.png';

interface PartnerHeaderProps {
  clinicName: string;
  clinicLogo?: string | null;
  slug: string;
}

export function PartnerHeader({ clinicName, clinicLogo, slug }: PartnerHeaderProps) {
  return (
    <div className="text-center mb-6">
      <Link to={`/c/${slug}`} className="inline-block">
        <img 
          src={clinicLogo || defaultLogo} 
          alt={clinicName}
          className="w-20 h-20 lg:w-24 lg:h-24 mx-auto shadow-lg mb-3 object-contain rounded-full bg-white"
        />
      </Link>
      <h1 className="text-xl lg:text-2xl font-bold text-foreground">{clinicName}</h1>
      <p className="text-xs text-muted-foreground mt-1">
        Сервис от{' '}
        <span className="font-medium text-primary">АнализПро</span>
      </p>
    </div>
  );
}
