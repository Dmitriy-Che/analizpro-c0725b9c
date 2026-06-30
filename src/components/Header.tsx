import { Link } from 'react-router-dom';
import logo from '@/assets/logo-optimized.webp';
import { EntitlementsBadge } from './EntitlementsBadge';

export function Header() {
  return (
    <div className="mb-6 lg:mb-8">
      <Link to="/" className="text-center block">
        <img
          src={logo}
          alt="АнализПро"
          width={96}
          height={96}
          className="w-20 h-20 lg:w-24 lg:h-24 mx-auto shadow-lg mb-3 animate-fade-in object-contain rounded-full"
          fetchPriority="high"
        />
        <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          АнализПро<span className="text-sm align-super">©</span>
        </h1>
      </Link>
      <div className="flex justify-center mt-3">
        <EntitlementsBadge variant="compact" />
      </div>
    </div>
  );
}

