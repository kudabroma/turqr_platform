import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const languages = ["EN", "RU", "TR"];

interface AdminHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AdminHeader({ title = "TurQR", showBack = false }: AdminHeaderProps) {
  const [activeLang, setActiveLang] = useState("EN");
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">turQR</span>
            <span className="text-lg font-semibold text-foreground">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeLang === lang
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
