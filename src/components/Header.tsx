import { Link } from 'react-router-dom';
import { EntitlementsBadge } from './EntitlementsBadge';

interface HeaderProps {
  showBadge?: boolean;
}

export function Header({ showBadge = true }: HeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      <Link to="/" className="text-center block">
        <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          АнализПро<span className="text-sm align-super">©</span>
        </h1>
      </Link>
      {showBadge && (
        <div className="flex justify-center mt-3">
          <EntitlementsBadge variant="compact" />
        </div>
      )}
    </div>
  );
}


