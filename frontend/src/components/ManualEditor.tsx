import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Type, Plus, Trash2, Palette, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { toast } from "sonner";

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  box_count: number;
  width: number;
  height: number;
}

interface TextBox {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  position: { x: number; y: number };
}

interface ManualEditorProps {
  selectedTemplate: MemeTemplate | null;
  onMemeCreated: (memeUrl: string) => void;
  userId: string;
}

const ManualEditor: React.FC<ManualEditorProps> = ({ 
  selectedTemplate, 
  onMemeCreated, 
  userId 
}) => {
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([
    {
      id: '1',
      text: '',
      fontSize: 40,
      color: '#FFFFFF',
      fontFamily: 'Impact',
      alignment: 'center',
      position: { x: 50, y: 20 }
    },
    {
      id: '2',
      text: '',
      fontSize: 40,
      color: '#FFFFFF',
      fontFamily: 'Impact',
      alignment: 'center',
      position: { x: 50, y: 80 }
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const addTextBox = () => {
    const newTextBox: TextBox = {
      id: Date.now().toString(),
      text: '',
      fontSize: 40,
      color: '#FFFFFF',
      fontFamily: 'Impact',
      alignment: 'center',
      position: { x: 50, y: 50 }
    };
    setTextBoxes([...textBoxes, newTextBox]);
  };

  const removeTextBox = (id: string) => {
    setTextBoxes(textBoxes.filter(box => box.id !== id));
  };

  const updateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(textBoxes.map(box => 
      box.id === id ? { ...box, ...updates } : box
    ));
  };

  const createMeme = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    if (textBoxes.every(box => !box.text.trim())) {
      toast.error('Please add some text to your meme');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/create-meme-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          text_boxes: textBoxes.map(box => ({ text: box.text })),
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meme');
      }

      const result = await response.json();
      if (result.success) {
        onMemeCreated(result.meme_url);
        toast.success('Meme created successfully! 🎉');
      } else {
        throw new Error(result.message || 'Failed to create meme');
      }
    } catch (error) {
      console.error('Failed to create meme:', error);
      toast.error('Failed to create meme. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!selectedTemplate) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📸</div>
        <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
        <p className="text-muted-foreground mb-4">
          Please select a template from the Templates tab to start editing
        </p>
        <Button variant="outline" onClick={() => window.location.hash = '#templates'}>
          Browse Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Type className="w-5 h-5" />
            <span>Manual Text Editor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <img 
              src={selectedTemplate.url} 
              alt={selectedTemplate.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-semibold">{selectedTemplate.name}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.width}×{selectedTemplate.height} • {selectedTemplate.box_count} text boxes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Boxes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Text Boxes</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addTextBox}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Text</span>
          </Button>
        </div>

        {textBoxes.map((textBox, index) => (
          <Card key={textBox.id} className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Text Box {index + 1}</h4>
                {textBoxes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTextBox(textBox.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Input */}
              <div>
                <Label htmlFor={`text-${textBox.id}`}>Text Content</Label>
                <Input
                  id={`text-${textBox.id}`}
                  value={textBox.text}
                  onChange={(e) => updateTextBox(textBox.id, { text: e.target.value })}
                  placeholder="Enter your meme text..."
                  className="mt-1"
                />
              </div>

              {/* Font Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`font-${textBox.id}`}>Font Family</Label>
                  <Select 
                    value={textBox.fontFamily} 
                    onValueChange={(value) => updateTextBox(textBox.id, { fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Impact">Impact</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`size-${textBox.id}`}>Font Size</Label>
                  <Input
                    id={`size-${textBox.id}`}
                    type="number"
                    min="12"
                    max="72"
                    value={textBox.fontSize}
                    onChange={(e) => updateTextBox(textBox.id, { fontSize: parseInt(e.target.value) || 40 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Color and Alignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`color-${textBox.id}`}>Text Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      id={`color-${textBox.id}`}
                      type="color"
                      value={textBox.color}
                      onChange={(e) => updateTextBox(textBox.id, { color: e.target.value })}
                      className="w-10 h-10 rounded border border-input cursor-pointer"
                    />
                    <Input
                      value={textBox.color}
                      onChange={(e) => updateTextBox(textBox.id, { color: e.target.value })}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Text Alignment</Label>
                  <div className="flex items-center space-x-1 mt-1">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight }
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={textBox.alignment === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTextBox(textBox.id, { alignment: value as any })}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Create Button */}
      <div className="text-center">
        <Button
          onClick={createMeme}
          disabled={isCreating || !selectedTemplate}
          size="lg"
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Meme...
            </>
          ) : (
            <>
              <Type className="w-5 h-5 mr-2" />
              Create Meme
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ManualEditor;