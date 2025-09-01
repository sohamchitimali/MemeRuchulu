import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-wiggle">🍛</div>
            <h1 className="text-2xl font-bold text-gradient">Meme Ruchulu</h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#templates" className="text-foreground hover:text-primary transition-colors font-medium">
              Templates
            </a>
            <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </a>
            <button 
              onClick={() => navigate('/editor')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Editor
            </button>
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" className="hidden md:inline-flex">
              Login 👤
            </Button>
            <Button 
              variant="meme"
              onClick={() => navigate('/editor')}
            >
              Create Meme 🎨
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;