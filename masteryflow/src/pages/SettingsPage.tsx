import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CheckCircle2, AlertTriangle, Trash2, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

export function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('mf_webhook_url') || '');
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Danger Zone State
  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  const handleSaveWebhook = () => {
    localStorage.setItem('mf_webhook_url', webhookUrl);
    toast.success('Webhook URL saved to local storage');
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const { error } = await supabase.from('students').select('id').limit(1);
      if (error) throw error;
      setConnectionStatus('success');
      toast.success('Database connection successful');
    } catch (err) {
      setConnectionStatus('error');
      toast.error('Database connection failed');
      console.error(err);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleHardDelete = async () => {
    if (deleteText !== 'DELETE') {
      toast.error('You must type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      // ONLY delete invoices with status 'cancelled'
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('status', 'cancelled');
      
      if (error) throw error;
      
      toast.success('Cancelled invoices permanently deleted');
      setDeleteText('');
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error('Failed to delete invoices');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>Test your Supabase connection status</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button onClick={testConnection} disabled={testingConnection}>
            {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>
          {connectionStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-5 w-5" /> Connected
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" /> Failed
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Configure external webhooks and behaviors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">Google Sheets Webhook URL (Apps Script)</Label>
            <Input 
              id="webhook" 
              value={webhookUrl} 
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
            />
            <Button onClick={handleSaveWebhook} variant="secondary" size="sm">Save Webhook</Button>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Auto-open Invoice Generator on Zero Balance</Label>
              <p className="text-sm text-muted-foreground">Automatically prompt invoice creation when student hits 0 credits</p>
            </div>
            <Switch checked={autoInvoice} onCheckedChange={setAutoInvoice} />
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.href = '/finance?tab=portfolio'}>
            <Globe className="mr-2 h-4 w-4" /> Edit Portfolio Targets
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions. Use with extreme caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hard Delete Cancelled Invoices</AlertTitle>
            <AlertDescription>
              This will permanently remove all invoices with status "Cancelled" from the database. This cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Type "DELETE" to confirm</Label>
            <Input 
              value={deleteText} 
              onChange={(e) => setDeleteText(e.target.value)} 
              className="font-mono uppercase"
            />
          </div>

          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteText !== 'DELETE' || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Permanently Delete Cancelled Invoices
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete all cancelled invoices."
        confirmLabel="Yes, delete everything"
        destructive
        onConfirm={handleHardDelete}
      />
    </div>
  );
}
