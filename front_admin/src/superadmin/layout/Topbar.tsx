import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <h1 className="font-medium">TurQR Super Admin</h1>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <Input placeholder="Search..." />
        </div>

        <Button variant="outline" className="flex items-center gap-1">
          Admin <ChevronDown size={16} />
        </Button>
      </div>
    </header>
  );
}