import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const TryOn = () => {
  const [selectedCategory, setSelectedCategory] = useState("makeup");
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const categories = [
    { id: "makeup", name: "Makeup" },
    { id: "clothes", name: "Clothes" },
    { id: "style-advise", name: "Style Advise" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setIsCameraActive(false);
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setUploadedImage(null);
        toast({
          title: "Camera enabled",
          description: "Your camera is now active.",
        });
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use this feature.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setIsCameraActive(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleApplyChanges = async () => {
    if (!prompt.trim() || (!uploadedImage && !isCameraActive)) {
      toast({
        title: "Missing information",
        description: "Please provide both an image and a prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let imageBase64 = uploadedImage;

      // If using camera, capture a frame
      if (isCameraActive && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          imageBase64 = canvas.toDataURL('image/jpeg');
        }
      }

      const response = await fetch(
        "http://localhost:5000/api/generate-tryon", // Points to your local server
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
            prompt,
            category: selectedCategory,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.generatedImageUrl);
      
      toast({
        title: "Image generated!",
        description: "Your virtual try-on is ready.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" />
            Virtual Try-On
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Camera/Preview Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-8">
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden gradient-card">
                  {generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Generated result"
                      className="w-full h-full object-cover"
                    />
                  ) : !uploadedImage && !isCameraActive ? (
                    <div className="text-center z-10">
                      <Camera size={64} className="mx-auto mb-4 text-primary" />
                      <h2 className="text-2xl font-semibold mb-2">Start Your Virtual Try-On</h2>
                      <p className="text-muted-foreground mb-6">
                        Allow camera access or upload a photo to get started
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button variant="hero" size="lg" className="gap-2" onClick={enableCamera}>
                          <Camera size={20} />
                          Enable Camera
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="gap-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={20} />
                          Upload Photo
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  ) : isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={uploadedImage!}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Controls */}
                <div className="mt-6 flex gap-4 justify-center">
                  {generatedImage && (
                    <Button variant="secondary" asChild>
                      <a href={generatedImage} download="tryon-result.png">
                        Download Result
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Sidebar - Product Selection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Category Selection */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Select Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Prompt Input */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Prompt</h3>
                <Textarea
                  placeholder="Describe what you'd like to try on or get advice about..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <Button 
                  className="w-full mt-4" 
                  disabled={!prompt.trim() || (!uploadedImage && !isCameraActive) || isGenerating}
                  onClick={handleApplyChanges}
                >
                  {isGenerating ? "Generating..." : "Apply Changes"}
                </Button>
              </Card>

              {/* Tips */}
              <Card className="p-6 gradient-card">
                <h3 className="text-lg font-semibold mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Ensure good lighting for best results</li>
                  <li>• Keep your face centered in the frame</li>
                  <li>• Try different angles and expressions</li>
                  <li>• Save looks you love with screenshots</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TryOn;
