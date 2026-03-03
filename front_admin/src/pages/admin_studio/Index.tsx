import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">turQR</span>
          <h1 className="text-3xl font-bold text-foreground">Yönetici Paneli</h1>
        </div>
        <p className="text-muted-foreground">Restoranınızı yönetin</p>
        <button
          onClick={() => navigate("/restaurant")}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Go to Restaurant Preview
        </button>
      </div>
    </div>
  );
};

export default Index;
