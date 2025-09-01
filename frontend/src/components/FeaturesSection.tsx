import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: "🎨",
    title: "AI-Powered Editing",
    description: "Use Google Gemini AI to enhance your memes with smart editing and style transfers",
    accent: "text-primary"
  },
  {
    icon: "💾",
    title: "Save & Share",
    description: "Save your creations to your personal gallery and share them with the world",
    accent: "text-secondary"
  },
  {
    icon: "🏆",
    title: "Daily Challenges",
    description: "Participate in daily meme challenges and compete with other creators",
    accent: "text-accent"
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Create memes in seconds with our intuitive editor and template library",
    accent: "text-primary"
  },
  {
    icon: "🌍",
    title: "Telugu Culture",
    description: "Specially designed for Telugu speakers with cultural references and humor",
    accent: "text-secondary"
  },
  {
    icon: "🎭",
    title: "Multiple Formats",
    description: "Create static memes, GIFs, and even animated content for all platforms",
    accent: "text-accent"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 px-6 bg-gradient-card">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Why Meme Ruchulu? 🌟
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the most feature-rich and fun meme creation platform designed for Telugu culture!
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:scale-105 transition-all duration-300 hover:shadow-xl bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30"
            >
              <CardHeader className="text-center pb-4">
                <div className={`text-5xl mb-4 group-hover:animate-bounce-slow ${feature.accent}`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-12 p-8 bg-gradient-meme rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-primary-foreground mb-4">
            Ready to Create Some Epic Memes? 🚀
          </h3>
          <p className="text-primary-foreground/90 mb-6">
            Join thousands of Telugu meme creators and start your journey today!
          </p>
          <div className="space-x-4">
            <button className="bg-background text-primary px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform">
              Get Started Now ✨
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;