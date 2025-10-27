import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Filter, User, MapPin, Briefcase, Languages, GraduationCap, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Worker {
  id: string;
  name: string;
  nationality_code: string;
  age: number;
  religion: string;
  maid_status: string;
  job1: string;
  job2: string | null;
  salary: number | null;
  languages: Array<{ name: string; level: string }>;
  education: { track: string };
  skills: {
    baby_sit: boolean;
    new_born: boolean;
    iron: boolean;
    wash: boolean;
    dish_wash: boolean;
    clean: boolean;
    drive: boolean;
    cook: boolean;
    tutor: boolean;
    housekeeping: boolean;
    computer_skills: boolean;
  };
  experience: Array<{ country: string; years: number }>;
  files: { photo?: string };
  status: string;
}

const WizardAlbum = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<"all" | "inside" | "outside">("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  // Fetch workers
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['wizard-album-workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .in('status', [
          'Available',
          'Ready for Market'
        ])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any as Worker[];
    }
  });

  // Filter workers
  const filteredWorkers = workers.filter((worker) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.nationality_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.job1.toLowerCase().includes(searchQuery.toLowerCase());

    // Location filter
    const isOutsideCountry = worker.status === 'Available';
    const isInsideCountry = worker.status === 'Ready for Market';
    
    let matchesLocation = true;
    if (locationFilter === 'inside') matchesLocation = isInsideCountry;
    if (locationFilter === 'outside') matchesLocation = isOutsideCountry;

    // Nationality filter
    const matchesNationality = nationalityFilter === 'all' || worker.nationality_code === nationalityFilter;

    // Skill filter
    let matchesSkill = true;
    if (skillFilter !== 'all') {
      matchesSkill = worker.skills[skillFilter as keyof typeof worker.skills] === true;
    }

    return matchesSearch && matchesLocation && matchesNationality && matchesSkill;
  });

  // Get unique nationalities
  const nationalities = Array.from(new Set(workers.map(w => w.nationality_code))).sort();

  // Get skill labels
  const skillOptions = [
    { value: 'baby_sit', label: 'Baby Sitting' },
    { value: 'new_born', label: 'Newborn Care' },
    { value: 'cook', label: 'Cooking' },
    { value: 'clean', label: 'Cleaning' },
    { value: 'iron', label: 'Ironing' },
    { value: 'wash', label: 'Washing' },
    { value: 'dish_wash', label: 'Dish Washing' },
    { value: 'drive', label: 'Driving' },
    { value: 'tutor', label: 'Tutoring' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'computer_skills', label: 'Computer Skills' },
  ];

  const getSkillBadges = (skills: Worker['skills']) => {
    return Object.entries(skills)
      .filter(([_, value]) => value === true)
      .map(([key]) => {
        const option = skillOptions.find(o => o.value === key);
        return option?.label || key;
      });
  };

  const getPhotoUrl = (worker: Worker) => {
    if (worker.files?.photo) {
      const { data } = supabase.storage.from('cvs').getPublicUrl(worker.files.photo);
      return data.publicUrl;
    }
    return null;
  };

  const getNationalityFlag = (code: string) => {
    const flags: Record<string, string> = {
      'PH': '🇵🇭',
      'ID': '🇮🇩',
      'IN': '🇮🇳',
      'KE': '🇰🇪',
      'UG': '🇺🇬',
      'ET': '🇪🇹',
      'SR': '🇱🇰',
      'MY': '🇲🇲',
      'NP': '🇳🇵',
      'VN': '🇻🇳',
    };
    return flags[code] || '🌍';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">CV Wizard Album</h1>
            <p className="text-muted-foreground">Browse available workers from CV Wizard submissions</p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, nationality, or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={locationFilter} onValueChange={(value: any) => setLocationFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="inside">Inside Country</SelectItem>
                      <SelectItem value="outside">Outside Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nationality</label>
                  <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Nationalities</SelectItem>
                      {nationalities.map((nat) => (
                        <SelectItem key={nat} value={nat}>
                          {getNationalityFlag(nat)} {nat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Skill</label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      {skillOptions.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Showing {filteredWorkers.length} of {workers.length} workers</span>
              </div>
            </CardContent>
          </Card>

          {/* Workers Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No workers found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((worker) => {
                const photoUrl = getPhotoUrl(worker);
                const isOutsideCountry = worker.status === 'Available';
                const skillBadges = getSkillBadges(worker.skills);
                
                return (
                  <Card key={worker.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Photo */}
                      <div className="aspect-square relative bg-muted">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={worker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-24 w-24 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant={isOutsideCountry ? "default" : "secondary"}>
                            {isOutsideCountry ? "Outside Country" : "Inside Country"}
                          </Badge>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        {/* Name & Nationality */}
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {getNationalityFlag(worker.nationality_code)}
                            {worker.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {worker.nationality_code} • {worker.age} years old • {worker.religion}
                          </p>
                        </div>

                        {/* Jobs */}
                        <div className="flex items-start gap-2">
                          <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">{worker.job1}</span>
                            {worker.job2 && <span className="text-muted-foreground"> / {worker.job2}</span>}
                          </div>
                        </div>

                        {/* Languages */}
                        {worker.languages.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Languages className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              {worker.languages.map(l => `${l.name} (${l.level})`).join(', ')}
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        <div className="flex items-start gap-2">
                          <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">{worker.education.track}</div>
                        </div>

                        {/* Experience */}
                        {worker.experience.length > 0 && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              {worker.experience.map(e => `${e.country} (${e.years}y)`).join(', ')}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {skillBadges.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Award className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {skillBadges.slice(0, 4).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {skillBadges.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{skillBadges.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Salary */}
                        {worker.salary && (
                          <div className="text-sm font-semibold text-primary">
                            AED {worker.salary.toLocaleString()} / month
                          </div>
                        )}

                        {/* Book Button */}
                        <Button 
                          asChild
                          className="w-full"
                        >
                          <Link to={`/book-worker?workerId=${worker.id}`}>
                            Book This Worker
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WizardAlbum;
