import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reason = (location.state as { reason?: string })?.reason;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 pt-10 pb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>

          {reason && (
            <p className="text-sm text-muted-foreground/70 italic">{reason}</p>
          )}

          <p className="text-xs text-muted-foreground/50 font-mono">
            {location.pathname}
          </p>

          <div className="mt-4 flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(-1)}>Go back</Button>
            <Button variant="secondary" onClick={() => navigate("/admin")}>
              Go to dashboard
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Uses useAuth().logout() when available; for now navigates to login
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
