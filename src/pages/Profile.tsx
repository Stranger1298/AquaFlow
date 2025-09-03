import React, { useEffect, useState } from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { useAuth } from '@/contexts/AuthContext';
import { getMongoClient, realmApp } from '@/integrations/mongodb/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setRole((user.role as 'customer' | 'vendor') || 'customer');

    const fetchProfile = async () => {
      if (realmApp && realmApp.currentUser) {
        try {
          const db = getMongoClient();
          const profiles = db.collection('profiles');
          const profile = await profiles.findOne({ user_id: user.id }) as Record<string, unknown> | null;
          if (profile) {
            setName((profile.name as string) || name);
            setRole(((profile.account_type as 'customer' | 'vendor')) || role);
            setEmail((profile.email as string) || email);
            setPhone((profile.phone as string) || '');
            setAddress((profile.address as string) || '');
          }
        } catch (err) {
          console.warn('Failed to load profile from Atlas', err);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, name, email, role]);

  const save = async () => {
    if (!user) return;
    try {
      if (realmApp && realmApp.currentUser) {
        const db = getMongoClient();
        const profiles = db.collection('profiles');
        await profiles.updateOne({ user_id: user.id }, { $set: { name, email, account_type: role, phone, address, updated_at: new Date().toISOString() } }, { upsert: true });
        toast({ title: 'Profile updated', description: 'Your profile was saved to Atlas.' });
      } else {
        // Demo fallback: update session/localStorage
        const raw = localStorage.getItem('aquaflow_demo_registered') || '[]';
        const users = JSON.parse(raw) as Array<Record<string, unknown>>;
        const idx = users.findIndex(u => (u.email as string) === email);
        if (idx >= 0) {
          users[idx].name = name;
          users[idx].phone = phone;
          users[idx].address = address;
          localStorage.setItem('aquaflow_demo_registered', JSON.stringify(users));
        }
        const sess = sessionStorage.getItem('aquaflow_demo_user');
        if (sess) {
          try {
            const s = JSON.parse(sess) as Record<string, unknown>;
            s.profile = { email, name, phone, address };
            sessionStorage.setItem('aquaflow_demo_user', JSON.stringify(s));
          } catch (e) {
            /* ignore */
          }
        }
        toast({ title: 'Profile updated (demo)', description: 'Profile saved locally.' });
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      toast({ title: 'Save failed', description: 'Could not save profile. See console for details.', variant: 'destructive' });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select value={role} onChange={e => setRole(e.target.value as 'customer' | 'vendor')} className="w-full border rounded px-3 py-2">
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded px-3 py-2" rows={4} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 flex justify-between">
          <Button onClick={save} disabled={loading}>Save Profile</Button>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link to="/orders">View Orders</Link>
            </Button>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
