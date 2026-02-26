import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage platform configuration</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="TurQR" />
            </div>
            <div className="space-y-2">
              <Label>Admin Email</Label>
              <Input defaultValue="admin@turqr.com" />
            </div>
            <div className="space-y-2">
              <Label>Default Trial Days</Label>
              <Input type="number" defaultValue="14" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Backend URL</Label>
              <Input defaultValue="https://api.turqr.com" />
              <p className="text-xs text-muted-foreground">Django/DRF backend endpoint</p>
            </div>
            <Button>Update</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
