import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-grid-move" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Animated Emojis */}
        <div className="text-6xl mb-6 animate-bounce-slow">
          🍛😂🎭
        </div>
        
        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-gradient animate-fade-in">
          Meme Ruchulu
        </h1>
        
        {/* Subtitle */}
        <p className="text-2xl md:text-3xl mb-4 text-foreground/80 font-medium">
          "Flavors of Memes"
        </p>
        
        {/* Telugu Tagline */}
        <p className="text-lg md:text-xl mb-8 text-muted-foreground">
          Like home-cooked entertainment 🏠✨
        </p>
        
        {/* Call to Action */}
        <div className="space-y-4 mb-8">
          <Button 
            variant="hero" 
            size="lg" 
            className="mr-4"
            onClick={() => navigate('/editor')}
          >
            Start Creating Memes 🎨
          </Button>
          <Button 
            variant="meme" 
            size="lg"
            onClick={() => navigate('/editor')}
          >
            Browse Templates 📸
          </Button>
        </div>
        
        {/* Fun Message */}
        <div className="bg-gradient-card p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
          <p className="text-lg font-semibold text-foreground">
            😎 Silent spectator avvaddu boss—ee pakkam full time meme cheyyadam jarugutundi
          </p>
          <p className="text-xl font-bold text-primary mt-2">
            నా meme, నా swasa! 😂
          </p>
        </div>
      </div>
      
      {/* Floating Decorative Elements */}
      <div className="absolute top-20 left-10 text-4xl animate-float">🔥</div>
      <div className="absolute top-40 right-20 text-4xl animate-bounce-slow">💯</div>
      <div className="absolute bottom-32 left-20 text-4xl meme-float">🚀</div>
      <div className="absolute bottom-20 right-10 text-4xl animate-wiggle">⭐</div>
    </section>
  );
};

export default HeroSection;