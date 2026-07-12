import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, BookOpen, Clock, Users, Star } from "lucide-react";

const CATEGORIES = ["All", "Climate Action", "Biodiversity", "Energy", "Ocean", "Food Systems", "SDG Overview", "Zero Waste"];

const VIDEOS = [
  {
    id: "RVjDNcZY7M4",
    title: "The Sustainable Development Goals Explained",
    description: "A clear introduction to all 17 UN SDGs and why they matter for our planet's future.",
    category: "SDG Overview",
    duration: "3:48",
    views: "4.2M",
    rating: 4.9,
    tags: ["SDGs", "UN", "Beginner"]
  },
  {
    id: "wbR-5mHI6bo",
    title: "Climate Change 101 | National Geographic",
    description: "Learn about the causes and effects of climate change and what we can do to stop it.",
    category: "Climate Action",
    duration: "3:04",
    views: "10.1M",
    rating: 4.8,
    tags: ["Climate", "Science", "National Geographic"]
  },
  {
    id: "DnWqMqxuvtM",
    title: "How Does Recycling Work?",
    description: "The complete journey of recycling — from your bin to reuse. Understand what really happens to your waste.",
    category: "Zero Waste",
    duration: "5:21",
    views: "3.8M",
    rating: 4.7,
    tags: ["Recycling", "Waste", "Environment"]
  },
  {
    id: "WmVLcj-XKnM",
    title: "How Solar Energy Works",
    description: "A detailed look at solar panels, photovoltaic cells, and how the sun powers our future.",
    category: "Energy",
    duration: "4:49",
    views: "6.7M",
    rating: 4.8,
    tags: ["Solar", "Renewable Energy", "Technology"]
  },
  {
    id: "HQTBL3ly_o8",
    title: "Why is Biodiversity So Important?",
    description: "Kim Preshoff explains why Earth's incredible diversity of species and ecosystems underpins everything we value.",
    category: "Biodiversity",
    duration: "4:17",
    views: "5.4M",
    rating: 4.9,
    tags: ["Biodiversity", "Ecosystems", "TED-Ed"]
  },
  {
    id: "hRY3M3JJnNI",
    title: "The Ocean is Running Out of Breath",
    description: "Scientists warn of dead zones expanding in our oceans as oxygen levels plummet due to climate change.",
    category: "Ocean",
    duration: "5:06",
    views: "2.9M",
    rating: 4.7,
    tags: ["Ocean", "Marine Life", "Climate"]
  },
  {
    id: "y3-BX-jN_Ac",
    title: "How Composting Works",
    description: "From kitchen scraps to rich soil — discover the science behind composting and why it matters.",
    category: "Zero Waste",
    duration: "3:53",
    views: "1.8M",
    rating: 4.6,
    tags: ["Composting", "Soil", "Zero Waste"]
  },
  {
    id: "WFt50IdQ2_M",
    title: "The Future of Food",
    description: "How can we feed 10 billion people sustainably? Explore innovations in agriculture and food systems.",
    category: "Food Systems",
    duration: "6:14",
    views: "4.1M",
    rating: 4.8,
    tags: ["Food", "Agriculture", "Sustainability"]
  },
  {
    id: "VBQ2KFvUnGw",
    title: "Wind Energy Explained",
    description: "Understand how wind turbines capture kinetic energy and convert it into clean electricity.",
    category: "Energy",
    duration: "3:37",
    views: "3.2M",
    rating: 4.7,
    tags: ["Wind Power", "Renewable", "Engineering"]
  },
  {
    id: "A_MjCqQoLLA",
    title: "Deforestation Explained",
    description: "National Geographic explains why forests are being destroyed and what the consequences are for our planet.",
    category: "Biodiversity",
    duration: "3:25",
    views: "7.3M",
    rating: 4.8,
    tags: ["Forests", "Deforestation", "National Geographic"]
  },
  {
    id: "GSmkgbqBass",
    title: "What is a Carbon Footprint?",
    description: "Learn what a carbon footprint is, how it is measured, and the most effective ways to reduce yours.",
    category: "Climate Action",
    duration: "4:01",
    views: "2.5M",
    rating: 4.6,
    tags: ["Carbon Footprint", "Emissions", "Lifestyle"]
  },
  {
    id: "rs0DVB_RawI",
    title: "The Plastic Problem",
    description: "Plastic pollution is one of the biggest challenges facing our ocean. Learn how it got there and what can be done.",
    category: "Ocean",
    duration: "5:28",
    views: "8.9M",
    rating: 4.9,
    tags: ["Plastic", "Ocean", "Pollution"]
  }
];

function VideoCard({ video, onPlay }: { video: typeof VIDEOS[0]; onPlay: (id: string) => void }) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onPlay(video.id)}>
      <div className="relative bg-black aspect-video overflow-hidden">
        <img
          src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <PlayCircle className="w-14 h-14 text-white opacity-90 group-hover:scale-110 transition-transform" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
          {video.duration}
        </div>
      </div>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </CardTitle>
        </div>
        <CardDescription className="text-xs line-clamp-2">{video.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{video.views}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{video.rating}</span>
          </div>
          <Badge variant="secondary" className="text-xs">{video.category}</Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {video.tags.map(tag => (
            <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Learn() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  const filtered = VIDEOS.filter(v => {
    const matchCat = category === "All" || v.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Sustainability Learning Hub</h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Watch curated videos to deepen your understanding of sustainability, climate science, and the UN Sustainable Development Goals.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No videos found for "{search}" in {category}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(video => (
          <VideoCard key={video.id} video={video} onPlay={setPlaying} />
        ))}
      </div>

      {playing && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            <Button
              className="absolute top-3 right-3 rounded-full"
              size="sm"
              onClick={() => setPlaying(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-primary">{VIDEOS.length}</div>
          <div className="text-sm text-muted-foreground">Curated Videos</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-primary">{CATEGORIES.length - 1}</div>
          <div className="text-sm text-muted-foreground">Topics Covered</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1"><Clock className="w-6 h-6" />1h+</div>
          <div className="text-sm text-muted-foreground">Total Learning</div>
        </Card>
      </div>
    </div>
  );
}
