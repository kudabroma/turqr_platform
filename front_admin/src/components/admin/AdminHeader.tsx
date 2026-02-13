import { useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  showBack?: boolean;
};

type Lang = "EN" | "RU" | "TR";

export function AdminHeader({ title, showBack }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // пока без глобального i18n: просто визуальный переключатель
  const currentLang: Lang = "EN";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleLangClick = (lang: Lang) => {
    // TODO: подключишь LanguageContext/i18n — сюда поставишь setLanguage(lang)
    // сейчас просто не ломаем UI
    console.log("Language selected:", lang);
  };

  const LangButton = ({ lang }: { lang: Lang }) => (
    <button
      type="button"
      onClick={() => handleLangClick(lang)}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        lang === currentLang
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted"
      )}
      aria-label={`Switch language to ${lang}`}
    >
      {lang}
    </button>
  );

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: back + logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/platform/Turlogo.png"
              alt="TurQR"
              className="h-7 w-7 object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="font-semibold truncate">{title}</div>
          </div>
        </div>

        {/* Right: language switcher + logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <LangButton lang="EN" />
            <LangButton lang="RU" />
            <LangButton lang="TR" />
          </div>

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
