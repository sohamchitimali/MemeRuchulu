import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  box_count: number;
  width: number;
  height: number;
}

interface AIEditorProps {
  selectedTemplate: MemeTemplate | null;
  onMemeCreated: (memeUrl: string) => void;
  userId: string;
}

const AIEditor: React.FC<AIEditorProps> = ({ 
  selectedTemplate, 
  onMemeCreated, 
  userId 
}) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      if (result.success) {
        setReferenceImage(result.base64_data);
        setReferenceImageName(result.filename);
        toast.success('Reference image uploaded successfully!');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateAIMeme = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for AI meme generation');
      return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        prompt: prompt.trim(),
        user_id: userId,
        reference_image_base64: referenceImage || undefined,
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/create-meme-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI meme');
      }

      const result = await response.json();
      if (result.success) {
        onMemeCreated(result.meme_url);
        toast.success('AI meme generated successfully! 🤖✨');
      } else {
        toast.error(result.message || 'AI generation failed');
      }
    } catch (error) {
      console.error('Failed to generate AI meme:', error);
      toast.error('Failed to generate AI meme. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const promptSuggestions = [
    "Make this meme about coding and debugging",
    "Create a funny meme about Monday mornings",
    "Transform this into a meme about coffee addiction",
    "Make a hilarious meme about work from home",
    "Create a meme about social media life",
    "Make this meme about weekend vs weekday energy",
    "Transform into a meme about trying to adult",
    "Create a funny meme about online shopping",
  ];

  return (
    <div className="space-y-6">
      {/* AI Editor Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>AI-Powered Meme Creator</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use Google Gemini 2.5 Flash to create AI-enhanced memes with natural language prompts
          </p>
        </CardHeader>
      </Card>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <img 
                src={selectedTemplate.url} 
                alt={selectedTemplate.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-semibold">Base Template: {selectedTemplate.name}</h4>
                <p className="text-sm text-muted-foreground">
                  AI will use this as reference for generating your meme
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="ai-prompt" className="text-base font-semibold">
            Describe Your Meme Idea 🧠
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Tell the AI what kind of meme you want to create. Be descriptive and creative!
          </p>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a funny meme about procrastination with a cat looking stressed while surrounded by deadlines..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Prompt Suggestions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">💡 Need inspiration? Try these prompts:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {promptSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(suggestion)}
                className="text-left justify-start h-auto py-2 px-3 whitespace-normal"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Reference Image Upload */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold mb-2 block">
            📸 Reference Images (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Upload additional images for the AI to use as context or style reference
          </p>
        </div>

        {!referenceImage ? (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">Upload Reference Image</h4>
            <p className="text-sm text-muted-foreground mb-4">
              PNG, JPG, or WebP up to 10MB
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Image</span>
            </Button>
          </div>
        ) : (
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={`data:image/png;base64,${referenceImage}`}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">Reference Image</h4>
                    <p className="text-sm text-muted-foreground">{referenceImageName}</p>
                    <p className="text-xs text-green-600 mt-1">✅ Ready for AI processing</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeReferenceImage}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={generateAIMeme}
          disabled={isGenerating || !prompt.trim()}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              AI is creating your meme...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate AI Meme ✨
            </>
          )}
        </Button>
        
        {prompt.trim() && (
          <p className="text-xs text-muted-foreground mt-2">
            Using Google Gemini 2.5 Flash Image Preview model
          </p>
        )}
      </div>

      {/* AI Tips */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-200/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center">
            <span className="mr-2">🤖</span>
            AI Tips for Better Results
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Be specific about the mood, style, and content you want</li>
            <li>• Mention colors, emotions, or themes for better results</li>
            <li>• Reference images help the AI understand your vision better</li>
            <li>• Try different prompts if the first result isn't perfect</li>
            <li>• The AI works best with clear, descriptive instructions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIEditor;