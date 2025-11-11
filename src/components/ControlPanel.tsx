import { CloudUpload, Loader2 } from "lucide-react";
import { useState, useRef, DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ControlPanel = () => {
  const [selectedLang, setSelectedLang] = useState<"angol" | "spanyol">("angol");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSeasons, setUploadedSeasons] = useState<{ angol: number; spanyol: number }>({ 
    angol: 0, 
    spanyol: 0 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {} as Record<string, string>);
    });
  };

  const validateCSV = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.length !== 240) {
      errors.push(`Hibás mérkőzésszám: ${data.length} (elvárva: 240)`);
    }

    const requiredColumns = [
      'match_time', 'home_team', 'away_team',
      'half_time_home_goals', 'half_time_away_goals',
      'full_time_home_goals', 'full_time_away_goals'
    ];

    if (data.length > 0) {
      const hasAllColumns = requiredColumns.every(col => col in data[0]);
      if (!hasAllColumns) {
        errors.push('Hiányzó oszlopok a CSV-ben!');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // CSV ellenőrzés
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Hibás fájltípus",
        description: "Csak CSV fájlokat lehet feltölteni!",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Fájl beolvasása
      const text = await file.text();
      const lines = text.trim().split('\n');

      // Alapvető validálás
      if (lines.length !== 241) {
        toast({
          title: "Hibás formátum",
          description: `Hibás sorok száma: ${lines.length} (elvárva: 241 - header + 240 mérkőzés)`,
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      // CSV parsing
      const parsedData = parseCSV(text);

      // Részletes validálás
      const validation = validateCSV(parsedData);
      if (!validation.valid) {
        toast({
          title: "Validációs hiba",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      // Edge function hívás
      const { data, error } = await supabase.functions.invoke('upload-matches', {
        body: {
          csv_content: text,
          league_type: selectedLang
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Ismeretlen hiba történt');
      }

      // Sikeres feltöltés
      toast({
        title: "Sikeres feltöltés!",
        description: `${selectedLang === 'angol' ? 'Angol' : 'Spanyol'} bajnokság, Szezon #${data.league.season_number}`,
      });

      // Szezonszám frissítése
      setUploadedSeasons(prev => ({
        ...prev,
        [selectedLang]: data.league.season_number
      }));

      // File input reset
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Feltöltési hiba",
        description: `Hiba történt a feltöltés során: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const preventDefaults = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  return (
    <aside className="lg:col-span-1">
      <div className="w-full max-w-md rounded-3xl glass-card shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)] sticky top-20">
        {/* Header Section */}
        <header className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Icon Badge */}
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full glass-strong shadow-inner">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.054 15.987H3.946"></path>
                </svg>
              </div>
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse-subtle" aria-label="Aktív állapot"></span>
            </div>
            
            {/* Title */}
            <div className="pt-0.5">
              <h1 className="text-[22px] leading-6 tracking-tight font-semibold text-foreground">Vezérlőközpont</h1>
              <p className="text-[13px] leading-5 text-muted-foreground">Eredmények feltöltése</p>
            </div>
          </div>

          {/* Upload Button */}
          <button 
            onClick={handleFileUpload}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-foreground glass-strong hover:glass-card hover:ring-1 hover:ring-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            aria-label="Fájl feltöltése"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Feltöltés...</span>
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4" aria-hidden="true" />
                <span>Feltöltés</span>
              </>
            )}
          </button>
        </header>

        {/* Language Selector */}
        <div className="px-4 sm:px-5">
          <div className="mx-auto mb-5 mt-1 w-full max-w-[200px]" role="radiogroup" aria-label="Bajnokság kiválasztása">
            <div className="relative flex items-center rounded-full p-1 glass-light">
              {/* Active Thumb */}
              <div 
                className="absolute top-1 left-1 h-[34px] w-[90px] rounded-full glass-strong backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${selectedLang === "angol" ? "0px" : "90px"})` }}
                aria-hidden="true"
              ></div>
              
              {/* Options */}
              <button 
                onClick={() => setSelectedLang("angol")}
                role="radio"
                aria-checked={selectedLang === "angol"}
                className={`text-[13px] transition-all duration-200 h-[34px] z-10 px-5 relative translate-x-2 ${
                  selectedLang === "angol" 
                    ? "font-semibold text-foreground" 
                    : "font-medium text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Angol
              </button>
              <button 
                onClick={() => setSelectedLang("spanyol")}
                role="radio"
                aria-checked={selectedLang === "spanyol"}
                className={`text-[13px] transition-all duration-200 h-[34px] z-10 px-5 relative translate-x-4 ${
                  selectedLang === "spanyol" 
                    ? "font-semibold text-foreground" 
                    : "font-medium text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Spanyol
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Seasons Info */}
        {(uploadedSeasons.angol > 0 || uploadedSeasons.spanyol > 0) && (
          <div className="px-4 sm:px-5 pb-3">
            <div className="rounded-xl bg-muted/30 p-3 space-y-1.5">
              {uploadedSeasons.angol > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Angol bajnokság:</span>
                  <span className="font-semibold text-foreground">Szezon #{uploadedSeasons.angol}</span>
                </div>
              )}
              {uploadedSeasons.spanyol > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spanyol bajnokság:</span>
                  <span className="font-semibold text-foreground">Szezon #{uploadedSeasons.spanyol}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Drop Zone */}
        <div className="px-4 sm:px-5 pb-5">
          <label 
            htmlFor="file-input" 
            className="group block cursor-pointer rounded-2xl glass-light p-3 ring-1 ring-border hover:ring-primary/50 hover:glass-card transition-all"
            onDragEnter={handleDragEnter}
            onDragOver={preventDefaults}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="rounded-2xl border border-border bg-muted/50 p-1.5">
              <div className={`relative aspect-square w-full rounded-2xl bg-muted/80 ring-1 overflow-hidden transition-all ${
                isDragging ? "ring-primary/50 scale-105" : "ring-border"
              }`}>
                
                {/* Inner Border */}
                <div className="pointer-events-none absolute inset-3 rounded-2xl ring-1 ring-border"></div>

                {/* Plus Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-6 w-6 text-foreground group-hover:scale-105 group-hover:rotate-90 transition-transform duration-300">
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-foreground/80"></span>
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-foreground/80"></span>
                  </div>
                </div>

                {/* Hover Text */}
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity">
                  Fájl hozzáadása vagy húzd ide
                </div>
              </div>
            </div>
          </label>
          <input 
            ref={fileInputRef}
            type="file" 
            id="file-input" 
            className="hidden"
            accept=".csv"
            disabled={isUploading}
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="CSV fájl feltöltése"
          />
        </div>

        {/* Outer Glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-border"></div>
      </div>
    </aside>
  );
};

export default ControlPanel;
