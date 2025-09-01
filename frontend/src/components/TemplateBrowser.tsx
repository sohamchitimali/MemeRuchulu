import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  box_count: number;
  width: number;
  height: number;
}

interface TemplateBrowserProps {
  onTemplateSelect: (template: MemeTemplate) => void;
}

const TemplateBrowser: React.FC<TemplateBrowserProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MemeTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchTerm, templates]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/templates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const templatesData = await response.json();
      
      // Debug: Check for duplicate IDs
      const templateIds = templatesData.map((t: any) => t.id);
      const uniqueIds = new Set(templateIds);
      if (templateIds.length !== uniqueIds.size) {
        console.warn(`⚠️ Duplicate template IDs detected: ${templateIds.length} total, ${uniqueIds.size} unique`);
        const duplicates = templateIds.filter((id: string, index: number) => templateIds.indexOf(id) !== index);
        console.warn('Duplicate IDs:', duplicates);
      }
      
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load meme templates');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading awesome templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search templates... (e.g., 'drake', 'distracted')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto">
        {filteredTemplates.map((template, index) => (
          <Card 
            key={`${template.id}-${index}`}  // Ensures uniqueness
            className="group hover:scale-105 transition-all duration-300 hover:shadow-xl bg-gradient-card border-primary/20 overflow-hidden cursor-pointer"
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="p-2">
              <CardTitle className="text-xs font-semibold truncate">
                {template.name}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-2 pt-0">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                <img 
                  src={template.url} 
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              
              <div className="text-xs text-muted-foreground mb-2">
                {template.box_count} text boxes
              </div>
              
              <Button 
                variant="meme" 
                size="sm"
                className="w-full text-xs py-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onTemplateSelect(template);
                }}
              >
                Select 🎨
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">😅</div>
          <p className="text-muted-foreground">
            {searchTerm ? 'No templates found matching your search' : 'No templates available'}
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Random Template Button */}
      <div className="text-center pt-4 border-t">
        <Button
          variant="hero"
          onClick={() => {
            if (templates.length > 0) {
              const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
              onTemplateSelect(randomTemplate);
            }
          }}
          disabled={templates.length === 0}
          className="animate-bounce-slow"
        >
          🎲 Surprise Me with Random Template!
        </Button>
      </div>
    </div>
  );
};

export default TemplateBrowser;
