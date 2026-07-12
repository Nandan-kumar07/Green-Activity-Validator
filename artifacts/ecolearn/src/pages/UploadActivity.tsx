import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitActivity } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon, CheckCircle, Loader2, Target, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetActivityStatsQueryKey, getListActivitiesQueryKey, getGetUserProfileQueryKey } from "@workspace/api-client-react";

const CATEGORY_LABELS = {
  tree_planting: "Tree Planting",
  waste_cleaning: "Waste Cleaning",
  recycling: "Recycling",
  composting: "Composting",
  energy_saving: "Energy Saving"
};

const formSchema = z.object({
  category: z.enum(["tree_planting", "waste_cleaning", "recycling", "composting", "energy_saving"]),
  description: z.string().optional(),
  image: z.instanceof(File, { message: "Please upload an image" })
});

export default function UploadActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const submitActivity = useSubmitActivity();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "waste_cleaning",
      description: "",
    },
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please upload an image." });
      return;
    }
    form.setValue("image", file, { shouldValidate: true });
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    submitActivity.mutate(
      { data: { category: data.category, description: data.description, image: data.image } },
      {
        onSuccess: (res) => {
          setSuccess(true);
          // Invalidate related queries to refresh dashboard/profile stats
          queryClient.invalidateQueries({ queryKey: getGetActivityStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          
          if (res.status === 'valid') {
            toast({
              title: "Activity Verified!",
              description: `Awesome! You earned ${res.pointsAwarded} points for this activity.`,
              className: "bg-primary text-primary-foreground border-primary"
            });
          } else if (res.status === 'pending') {
             toast({
              title: "Activity Submitted",
              description: "Your activity is pending manual review.",
            });
          } else {
             toast({
              variant: "destructive",
              title: "Verification Failed",
              description: "The AI could not verify this activity. It has been marked invalid.",
            });
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "There was an error submitting your activity.",
          });
        }
      }
    );
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <Card className="text-center border-primary/20 shadow-lg bg-primary/5">
          <CardContent className="pt-12 pb-12 space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 text-primary mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Mission Accomplished!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your activity has been logged successfully. Every action makes a difference for our planet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button variant="outline" onClick={() => { setSuccess(false); form.reset(); setPreviewUrl(null); }}>
                Submit Another
              </Button>
              <Button onClick={() => setLocation("/dashboard")} className="gap-2">
                <Target className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Log Activity</h1>
        <p className="text-muted-foreground mt-1">Upload a photo of your sustainable action for AI verification.</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem>
                    <FormLabel>Activity Photo</FormLabel>
                    <FormControl>
                      <div 
                        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out ${
                          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                        } ${previewUrl ? "p-2" : "p-12"}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDrop={handleDrop}
                      >
                        {previewUrl ? (
                          <div className="relative rounded-lg overflow-hidden group">
                            <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <Button type="button" variant="secondary" onClick={() => { setPreviewUrl(null); form.setValue("image", undefined as any); }}>
                                Remove Photo
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground">
                              <UploadCloud className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="font-medium text-lg">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                            </div>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {value === 'tree_planting' && <Leaf className="w-4 h-4 text-green-600" />}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose the type of action performed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add some details about what you did..." 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="bg-muted/30 p-6 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> AI will analyze the image for points
              </p>
              <Button type="submit" disabled={submitActivity.isPending} className="min-w-[140px]">
                {submitActivity.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Submit Activity"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
