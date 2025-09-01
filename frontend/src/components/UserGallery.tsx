import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Sparkles, 
  Type,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserMeme {
  id: string;
  user_id: string;
  meme_url: string;
  template_id?: string;
  prompt_used?: string;
  created_at: string;
  is_ai_generated: boolean;
}

interface UserGalleryProps {
  userMemes: UserMeme[];
  onRefresh: () => void;
}

const UserGallery: React.FC<UserGalleryProps> = ({ userMemes, onRefresh }) => {
  const [deletingMemeId, setDeletingMemeId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (meme: UserMeme) => {
    if (meme.meme_url.startsWith('data:')) {
      // Handle base64 data URLs (AI generated images)
      const link = document.createElement('a');
      link.href = meme.meme_url;
      link.download = `meme-${meme.id}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle regular URLs
      window.open(meme.meme_url, '_blank');
    }
    toast.success('Meme downloaded! 📥');
  };

  const handleDelete = async (memeId: string) => {
    setDeletingMemeId(memeId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user-memes/${memeId}?user_id=user_123`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete meme');
      }

      onRefresh();
      toast.success('Meme deleted successfully! 🗑️');
    } catch (error) {
      console.error('Failed to delete meme:', error);
      toast.error('Failed to delete meme. Please try again.');
    } finally {
      setDeletingMemeId(null);
    }
  };

  if (userMemes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">🖼️</div>
        <h3 className="text-xl font-semibold mb-2">Your Gallery is Empty</h3>
        <p className="text-muted-foreground mb-6">
          Create some amazing memes to see them here!
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Get started by:</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Type className="w-3 h-3" />
              <span>Using Manual Editor</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Trying AI Generation</span>
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Meme Gallery</h3>
          <p className="text-sm text-muted-foreground">
            {userMemes.length} meme{userMemes.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Memes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {userMemes.map((meme) => (
          <Card key={meme.id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {meme.is_ai_generated ? (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Type className="w-3 h-3" />
                      <span>Manual</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(meme.created_at)}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Meme Image */}
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img 
                  src={meme.meme_url} 
                  alt="User meme"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Meme Info */}
              {meme.prompt_used && (
                <div className="bg-gradient-card p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">AI Prompt:</p>
                  <p className="text-sm line-clamp-2">{meme.prompt_used}</p>
                </div>
              )}

              {meme.template_id && (
                <div className="text-xs text-muted-foreground">
                  Template: {meme.template_id.replace('_', ' ').replace('-', ' ')}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(meme)}
                  className="flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingMemeId === meme.id}
                      className="text-destructive hover:text-destructive flex items-center space-x-1"
                    >
                      {deletingMemeId === meme.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive"></div>
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <span>Delete Meme</span>
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this meme? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(meme.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gallery Stats */}
      <Card className="bg-gradient-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {userMemes.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Memes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">
                {userMemes.filter(m => m.is_ai_generated).length}
              </div>
              <div className="text-sm text-muted-foreground">AI Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {userMemes.filter(m => !m.is_ai_generated).length}
              </div>
              <div className="text-sm text-muted-foreground">Manual Created</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserGallery;