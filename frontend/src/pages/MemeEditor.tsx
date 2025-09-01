import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Save, Sparkles, Type, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TemplateBrowser from "@/components/TemplateBrowser";
import ManualEditor from "@/components/ManualEditor";
import AIEditor from "@/components/AIEditor";
import UserGallery from "@/components/UserGallery";
import { toast } from "sonner";

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  box_count: number;
  width: number;
  height: number;
}

interface UserMeme {
  id: string;
  user_id: string;
  meme_url: string;
  template_id?: string;
  prompt_used?: string;
  created_at: string;
  is_ai_generated: boolean;
}

const MemeEditor = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [currentMeme, setCurrentMeme] = useState<string | null>(null);
  const [userMemes, setUserMemes] = useState<UserMeme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock user ID - in real app this would come from authentication
  const userId = "user_123";

  useEffect(() => {
    fetchUserMemes();
  }, []);

  const fetchUserMemes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-memes/${userId}`);
      if (response.ok) {
        const memes = await response.json();
        setUserMemes(memes);
      }
    } catch (error) {
      console.error('Failed to fetch user memes:', error);
    }
  };

  const handleTemplateSelect = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    setActiveTab("manual");
    toast.success(`Selected template: ${template.name}`);
  };

  const handleMemeCreated = (memeUrl: string) => {
    setCurrentMeme(memeUrl);
    fetchUserMemes(); // Refresh gallery
    toast.success("Meme created successfully! 🎉");
  };

  const handleDownloadMeme = () => {
    if (!currentMeme) return;
    
    if (currentMeme.startsWith('data:')) {
      // Handle base64 data URLs (AI generated images)
      const link = document.createElement('a');
      link.href = currentMeme;
      link.download = `meme-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle regular URLs
      window.open(currentMeme, '_blank');
    }
    toast.success("Meme downloaded! 📥");
  };

  const handleSaveMeme = async () => {
    if (!currentMeme) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-memes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          meme_url: currentMeme,
          template_id: selectedTemplate?.id || null,
        }),
      });

      if (response.ok) {
        fetchUserMemes();
        toast.success("Meme saved to gallery! 💾");
      } else {
        throw new Error('Failed to save meme');
      }
    } catch (error) {
      console.error('Failed to save meme:', error);
      toast.error("Failed to save meme");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="text-2xl animate-wiggle">🎨</div>
                <h1 className="text-xl font-bold text-gradient">Meme Studio</h1>
              </div>
            </div>
            
            {currentMeme && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMeme}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="meme"
                  size="sm"
                  onClick={handleSaveMeme}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Editor Controls */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🍛</span>
                  <span>Meme Creation Studio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="templates" className="flex items-center space-x-2">
                      <span>📸</span>
                      <span>Templates</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center space-x-2">
                      <Type className="w-4 h-4" />
                      <span>Manual</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Editor</span>
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="flex items-center space-x-2">
                      <span>🖼️</span>
                      <span>Gallery</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="templates" className="mt-6">
                    <TemplateBrowser onTemplateSelect={handleTemplateSelect} />
                  </TabsContent>

                  <TabsContent value="manual" className="mt-6">
                    <ManualEditor 
                      selectedTemplate={selectedTemplate}
                      onMemeCreated={handleMemeCreated}
                      userId={userId}
                    />
                  </TabsContent>

                  <TabsContent value="ai" className="mt-6">
                    <AIEditor 
                      selectedTemplate={selectedTemplate}
                      onMemeCreated={handleMemeCreated}
                      userId={userId}
                    />
                  </TabsContent>

                  <TabsContent value="gallery" className="mt-6">
                    <UserGallery 
                      userMemes={userMemes}
                      onRefresh={fetchUserMemes}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>👀</span>
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20">
                  {currentMeme ? (
                    <img 
                      src={currentMeme} 
                      alt="Current meme"
                      className="w-full h-full object-cover"
                    />
                  ) : selectedTemplate ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={selectedTemplate.url} 
                        alt={selectedTemplate.name}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <span className="text-4xl mb-2 block">🎨</span>
                          <p className="text-sm font-medium">Create your meme</p>
                          <p className="text-xs">Use Manual or AI Editor</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <span className="text-4xl mb-2 block">📸</span>
                        <p className="text-sm font-medium">Select a template</p>
                        <p className="text-xs">to start creating</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedTemplate && (
                  <div className="mt-4 p-3 bg-gradient-card rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Selected Template</h4>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTemplate.width}×{selectedTemplate.height} • {selectedTemplate.box_count} text boxes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeEditor;