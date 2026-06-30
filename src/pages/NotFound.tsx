import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { DesktopNav } from "@/components/DesktopNav";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pt-16 lg:pt-0">
      <DesktopNav />
      <BottomNavigation />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-black text-primary">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Страница не найдена</p>
          <Button onClick={() => navigate("/")}>На главную</Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
