import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Target, Globe, ArrowRight } from "lucide-react";

const SDG_DATA = [
  {
    id: 1, color: "#E5243B", emoji: "🚫",
    title: "No Poverty",
    description: "End poverty in all its forms everywhere by 2030.",
    details: "More than 700 million people still live in extreme poverty and struggle to fulfil basic needs. Eradicating poverty requires economic growth, social protection systems, and equal access to basic services.",
    targets: ["Eradicate extreme poverty for all people everywhere", "Reduce at least by half the proportion of men, women and children living in poverty", "Implement nationally appropriate social protection systems", "Ensure equal rights to economic resources for all"],
    facts: ["736 million people live on less than $1.90/day", "1 in 10 people worldwide live in extreme poverty", "Sub-Saharan Africa has the highest rates of extreme poverty"],
    actions: ["Support fair-trade products", "Donate to microfinance initiatives", "Advocate for living wages", "Volunteer with local food banks"]
  },
  {
    id: 2, color: "#DDA63A", emoji: "🌾",
    title: "Zero Hunger",
    description: "End hunger, achieve food security and improved nutrition, and promote sustainable agriculture.",
    details: "One in nine people in the world today are undernourished. Sustainable food systems, small-scale farmers support, and reduced food waste are critical to ending hunger.",
    targets: ["End hunger and ensure access to safe, nutritious food for all", "End all forms of malnutrition", "Double agricultural productivity of small-scale food producers", "Ensure sustainable food production systems"],
    facts: ["821 million people are chronically hungry", "1/3 of all food produced globally is lost or wasted", "Small-scale farmers produce 70% of the world's food"],
    actions: ["Reduce food waste at home", "Support local farmers markets", "Plant a garden", "Compost organic waste"]
  },
  {
    id: 3, color: "#4C9F38", emoji: "💚",
    title: "Good Health & Well-being",
    description: "Ensure healthy lives and promote well-being for all at all ages.",
    details: "Significant progress has been made in health over recent decades, but the COVID-19 pandemic exposed fragility in health systems. Universal health coverage, addressing communicable and non-communicable diseases are key priorities.",
    targets: ["Reduce global maternal mortality", "End preventable deaths of newborns and children", "Combat AIDS, tuberculosis, malaria", "Achieve universal health coverage"],
    facts: ["400 million people lack basic healthcare", "Preventable diseases kill 13 million people annually", "Mental health disorders affect 1 in 4 people"],
    actions: ["Get vaccinated", "Exercise regularly", "Practice mental health care", "Support global health organizations"]
  },
  {
    id: 4, color: "#C5192D", emoji: "📚",
    title: "Quality Education",
    description: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.",
    details: "Education enables upward socioeconomic mobility and is key to escaping poverty. Yet 617 million children lack basic literacy and numeracy skills. Inclusive, equitable quality education is fundamental to sustainable development.",
    targets: ["Ensure all girls and boys complete free primary and secondary schooling", "Equal access to vocational training", "Eliminate gender disparities in education", "Universal literacy and numeracy"],
    facts: ["617 million children lack basic literacy", "64 million girls are out of school", "Each additional year of schooling increases earnings by 10%"],
    actions: ["Mentor a student", "Donate books or school supplies", "Support girls' education initiatives", "Volunteer as a tutor"]
  },
  {
    id: 5, color: "#FF3A21", emoji: "⚧️",
    title: "Gender Equality",
    description: "Achieve gender equality and empower all women and girls.",
    details: "Gender equality is not just a fundamental human right, but a necessary foundation for a peaceful, prosperous, and sustainable world. Progress has been made, but gaps remain in pay, leadership, and access to opportunities.",
    targets: ["End all forms of discrimination against women and girls", "Eliminate violence against women", "Ensure women's full participation in leadership", "Universal access to sexual and reproductive health"],
    facts: ["Women earn 20% less than men globally", "1 in 3 women experience violence in their lifetime", "Women hold only 25% of parliamentary seats"],
    actions: ["Support women-led businesses", "Challenge gender stereotypes", "Advocate for equal pay", "Mentor women in your field"]
  },
  {
    id: 6, color: "#26BDE2", emoji: "💧",
    title: "Clean Water & Sanitation",
    description: "Ensure availability and sustainable management of water and sanitation for all.",
    details: "Water scarcity affects more than 40% of the global population and is projected to rise. By 2050, at least one in four people will suffer recurring water shortages. Safe water and sanitation are essential for health and dignity.",
    targets: ["Universal safe drinking water access", "Access to adequate sanitation and hygiene", "Improve water quality globally", "Protect water-related ecosystems"],
    facts: ["2.2 billion people lack safe drinking water", "4.2 billion lack safe sanitation", "80% of wastewater flows back to ecosystems untreated"],
    actions: ["Fix leaky taps", "Take shorter showers", "Use water-efficient appliances", "Support clean water charities"]
  },
  {
    id: 7, color: "#FCC30B", emoji: "⚡",
    title: "Affordable & Clean Energy",
    description: "Ensure access to affordable, reliable, sustainable and modern energy for all.",
    details: "Energy is central to nearly every major challenge and opportunity the world faces today. Sustainable energy transforms lives, economies, and the planet. Yet 759 million people still lack access to electricity.",
    targets: ["Universal access to modern energy", "Increase renewable energy share globally", "Double the global rate of energy efficiency improvement", "Expand access to clean energy research"],
    facts: ["759 million people lack electricity", "Renewable energy costs have dropped 90% in 10 years", "Buildings account for 40% of global energy use"],
    actions: ["Switch to renewable energy", "Use LED lighting", "Insulate your home", "Drive electric or use public transit"]
  },
  {
    id: 8, color: "#A21942", emoji: "💼",
    title: "Decent Work & Economic Growth",
    description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.",
    details: "About half the world's population still lives on the equivalent of about US$2 a day. Economic growth must be inclusive to provide sustainable jobs and promote equality. Decent work means safe conditions, fair wages, and social protection.",
    targets: ["Sustain economic growth per capita", "Achieve full and productive employment", "Eliminate forced labor and child labor", "Protect labor rights and safe work environments"],
    facts: ["190 million people are unemployed globally", "2 billion people work informally without protections", "Youth unemployment is 3× higher than adults"],
    actions: ["Buy from ethical companies", "Support fair trade", "Advocate for worker rights", "Mentor young job seekers"]
  },
  {
    id: 9, color: "#FD6925", emoji: "🏭",
    title: "Industry, Innovation & Infrastructure",
    description: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.",
    details: "Investment in infrastructure and innovation are crucial drivers of economic growth and development. With over half the world's population now living in cities, mass transit and renewable energy are key areas for improvement.",
    targets: ["Develop quality infrastructure", "Promote inclusive industrialization", "Increase access to financial services for small industries", "Upgrade infrastructure with sustainable technologies"],
    facts: ["2.6 billion people lack access to basic sanitation infrastructure", "Manufacturing causes 19% of global greenhouse gas emissions", "R&D spending remains low in developing countries"],
    actions: ["Support STEM education", "Use sustainable products", "Advocate for green infrastructure", "Reduce manufacturing waste"]
  },
  {
    id: 10, color: "#DD1367", emoji: "⚖️",
    title: "Reduced Inequalities",
    description: "Reduce inequality within and among countries.",
    details: "Income inequality is rising with the richest 10% earning up to 40% of total global income. The bottom 10% earns only 2-7%. Policy reforms, strong institutions, and equal access to opportunities are needed to reduce all forms of inequality.",
    targets: ["Progressively achieve income growth for the bottom 40%", "Empower social, economic and political inclusion", "Ensure equal opportunity regardless of race, sex, disability", "Regulate global financial markets"],
    facts: ["The 26 richest people own as much as the poorest 50%", "Inequality costs developing countries $500B/year", "Discrimination costs the global economy trillions annually"],
    actions: ["Support progressive taxation policies", "Advocate for inclusive hiring", "Donate to equality organizations", "Challenge discrimination when you see it"]
  },
  {
    id: 11, color: "#FD9D24", emoji: "🏙️",
    title: "Sustainable Cities & Communities",
    description: "Make cities and human settlements inclusive, safe, resilient and sustainable.",
    details: "Half of humanity lives in cities today and 6.5 billion people will do so by 2050. Cities cover just 3% of Earth's land, but account for 70% of energy consumption and carbon emissions. Sustainable urban planning is essential.",
    targets: ["Universal access to affordable housing", "Safe and affordable transport systems", "Inclusive and sustainable urbanization", "Protect cultural and natural heritage"],
    facts: ["55% of the world's population lives in cities", "Cities use 78% of the world's energy", "1 billion people live in urban slums"],
    actions: ["Use public transportation", "Walk or cycle", "Support local community initiatives", "Reduce urban waste"]
  },
  {
    id: 12, color: "#BF8B2E", emoji: "♻️",
    title: "Responsible Consumption & Production",
    description: "Ensure sustainable consumption and production patterns.",
    details: "The world is consuming far more natural resources than can be sustainably replenished. If the global population reached 9.6 billion by 2050 and consumed like today's average, we would need almost three planets to provide natural resources.",
    targets: ["Implement sustainable management of natural resources", "Halve global food waste by 2030", "Manage chemicals and wastes responsibly", "Encourage sustainable public procurement"],
    facts: ["We need 1.6 Earths to sustain current consumption", "Food waste is responsible for 8% of greenhouse gases", "Only 20% of electronic waste is formally recycled"],
    actions: ["Buy only what you need", "Choose sustainable products", "Recycle and compost", "Repair instead of replace"]
  },
  {
    id: 13, color: "#3F7E44", emoji: "🌡️",
    title: "Climate Action",
    description: "Take urgent action to combat climate change and its impacts.",
    details: "Climate change is affecting every country on every continent. It is disrupting national economies, affecting lives and costing people, communities and countries dearly. The Paris Agreement aims to limit warming to 1.5°C above pre-industrial levels.",
    targets: ["Strengthen resilience to climate-related hazards", "Integrate climate measures into national policies", "Improve education and capacity for climate action", "Implement the Paris Agreement"],
    facts: ["The last decade was the hottest on record", "Sea levels are rising 3.6mm per year", "CO2 levels are at their highest in 3 million years"],
    actions: ["Plant trees", "Reduce your carbon footprint", "Switch to renewable energy", "Eat less meat"]
  },
  {
    id: 14, color: "#0A97D9", emoji: "🐠",
    title: "Life Below Water",
    description: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development.",
    details: "The world's oceans – their temperature, chemistry, currents and life – drive global systems that make Earth habitable for humankind. Ocean acidification has increased by 26% since the industrial revolution, threatening marine ecosystems.",
    targets: ["Prevent and reduce marine pollution", "Protect marine and coastal ecosystems", "Minimize ocean acidification", "End overfishing and destructive fishing practices"],
    facts: ["Oceans absorb 30% of the CO2 produced by humans", "80% of marine pollution comes from land", "Over 3 billion people depend on marine life for protein"],
    actions: ["Reduce plastic use", "Eat sustainable seafood", "Clean up beaches", "Support ocean conservation organizations"]
  },
  {
    id: 15, color: "#56C02B", emoji: "🌳",
    title: "Life on Land",
    description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification.",
    details: "Forests cover 30% of the Earth's surface and are home to most of the world's biodiversity. Each year, 13 million hectares of forests are lost. Land degradation affects 3.2 billion people worldwide. Protecting land ecosystems is vital.",
    targets: ["Ensure conservation of terrestrial ecosystems", "End deforestation and restore degraded forests", "Combat desertification and land degradation", "Protect threatened species"],
    facts: ["80% of all terrestrial species live in forests", "13 million hectares of forests are lost annually", "1 million species face extinction due to human activity"],
    actions: ["Plant native trees", "Support wildlife conservation", "Reduce paper consumption", "Choose certified sustainable products"]
  },
  {
    id: 16, color: "#00689D", emoji: "☮️",
    title: "Peace, Justice & Strong Institutions",
    description: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all.",
    details: "Without peace, stability, human rights and effective governance, it is difficult to achieve sustainable development. Conflict, insecurity, weak institutions, and limited access to justice remain significant barriers to sustainable development.",
    targets: ["Reduce all forms of violence globally", "End abuse and exploitation of children", "Promote the rule of law and equal access to justice", "Build effective, accountable institutions at all levels"],
    facts: ["1 billion people live in fragile states", "The rule of law is absent in 40% of countries", "Conflict and violence cost the global economy $14.3 trillion"],
    actions: ["Engage in civic life and vote", "Support transparency in government", "Report corruption", "Respect the rule of law"]
  },
  {
    id: 17, color: "#19486A", emoji: "🤝",
    title: "Partnerships for the Goals",
    description: "Strengthen the means of implementation and revitalize the global partnership for sustainable development.",
    details: "The SDGs can only be realized with strong global partnerships and cooperation. Official development assistance, trade, debt relief, technology transfer, and capacity building are all needed to achieve the ambitious 2030 Agenda.",
    targets: ["Strengthen domestic resource mobilization", "Developed countries fulfil official development assistance commitments", "Promote a universal, rules-based trade system", "Enhance global partnership for sustainable development"],
    facts: ["$142 billion in foreign aid was provided in 2020", "$4 trillion annual investment gap exists for the SDGs", "SDGs require unprecedented cooperation across sectors"],
    actions: ["Support international development organizations", "Advocate for fair trade policies", "Collaborate across sectors", "Share knowledge and expertise"]
  }
];

export default function SDGs() {
  const [selected, setSelected] = useState<typeof SDG_DATA[0] | null>(null);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">UN Sustainable Development Goals</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          The 17 SDGs are the world's shared blueprint for peace and prosperity for people and the planet by 2030. Click any goal to explore it in depth.
        </p>
        <Badge variant="outline" className="text-sm px-4 py-1">
          🗓️ Agenda 2030 · Adopted September 2015 · 193 UN Member States
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {SDG_DATA.map((sdg) => (
          <button
            key={sdg.id}
            onClick={() => setSelected(sdg)}
            className="group relative rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center p-3 text-white font-bold text-center transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2"
            style={{ backgroundColor: sdg.color }}
          >
            <span className="text-3xl mb-1">{sdg.emoji}</span>
            <span className="text-xs leading-tight opacity-90 group-hover:opacity-100 font-semibold">
              {sdg.id}. {sdg.title}
            </span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      <div className="bg-muted/50 rounded-2xl p-6 text-center space-y-2">
        <Target className="w-6 h-6 text-primary mx-auto" />
        <p className="font-semibold">169 Targets · 232 Indicators</p>
        <p className="text-sm text-muted-foreground">The SDGs are integrated — progress in one area affects outcomes in others. No goal can be achieved in isolation.</p>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div
                className="w-full rounded-xl p-6 text-white flex items-center gap-4 mb-2"
                style={{ backgroundColor: selected.color }}
              >
                <span className="text-5xl">{selected.emoji}</span>
                <div>
                  <p className="text-sm opacity-80 font-medium">SDG {selected.id}</p>
                  <DialogTitle className="text-2xl font-bold text-white">{selected.title}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">{selected.details}</p>

              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Key Targets</h3>
                <ul className="space-y-2">
                  {selected.targets.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: selected.color }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Key Facts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selected.facts.map((f, i) => (
                    <div key={i} className="rounded-lg p-3 text-sm text-white font-medium" style={{ backgroundColor: selected.color + "cc" }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">What You Can Do</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selected.actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-muted rounded-lg p-2">
                      <span className="text-base">✅</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full mt-2 text-white font-semibold"
                style={{ backgroundColor: selected.color }}
                onClick={() => setSelected(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
