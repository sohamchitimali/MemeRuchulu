import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

// Mock templates for now - will integrate with API later
const mockTemplates = [
  {
    id: "drake",
    name: "Drake Pointing",
    imageUrl: "https://i.imgflip.com/30b1gx.jpg",
    isPopular: true
  },
  {
    id: "distracted-boyfriend",
    name: "Distracted Boyfriend",
    imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
    isPopular: true
  },
  {
    id: "woman-yelling-cat",
    name: "Woman Yelling at Cat",
    imageUrl: "https://i.imgflip.com/345v97.jpg",
    isPopular: false
  },
  {
    id: "expanding-brain",
    name: "Expanding Brain",
    imageUrl: "https://i.imgflip.com/1jwhww.jpg",
    isPopular: true
  },
  {
    id: "two-buttons",
    name: "Two Buttons",
    imageUrl: "https://i.imgflip.com/1g8my4.jpg",
    isPopular: false
  },
  {
    id: "change-my-mind",
    name: "Change My Mind",
    imageUrl: "https://i.imgflip.com/24y43o.jpg",
    isPopular: true
  }
];

const TemplateGallery = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-6" id="templates">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Popular Templates 🔥
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick your favorite template and start creating hilarious memes that'll make everyone laugh!
          </p>
        </div>
        
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="group hover:scale-105 transition-all duration-300 hover:shadow-xl bg-gradient-card border-primary/20 overflow-hidden"
            >
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{template.name}</span>
                  {template.isPopular && (
                    <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full animate-glow">
                      🔥 Hot
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img 
                    src={template.imageUrl} 
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button 
                  variant="meme" 
                  className="w-full"
                  onClick={() => navigate('/editor')}
                >
                  Create Meme 🎨
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button 
            variant="fun" 
            size="lg"
            onClick={() => navigate('/editor')}
          >
            Load More Templates 📸
          </Button>
        </div>
        
        {/* Random Template Feature */}
        <div className="text-center mt-8">
          <Button 
            variant="hero" 
            className="animate-bounce-slow"
            onClick={() => navigate('/editor')}
          >
            🎲 Surprise Me with Random Template!
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TemplateGallery;