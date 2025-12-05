import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

type UserRole = 'admin' | 'manager' | 'cashier' | 'driver';

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  status: string | null;
  role?: UserRole;
}

export default function Users() {
  const { user: currentUser, role: currentRole, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'cashier' as UserRole,
  });

  useEffect(() => {
    if (currentRole === 'admin') {
      loadUsers();
    }
  }, [currentRole]);

  async function loadUsers() {
    try {
      // Fetch all profiles with their roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: (profile.user_roles as any)?.[0]?.role || undefined
      })) || [];

      setUsers(usersWithRoles as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (currentRole !== 'admin') {
      toast.error("Vous n'avez pas la permission de créer des utilisateurs");
      return;
    }

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName,
        }
      });

      if (authError) throw authError;

      // Add role to user_roles table
      if (authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: formData.role,
          });

        if (roleError) throw roleError;
      }

      toast.success('Utilisateur créé avec succès');
      setIsDialogOpen(false);
      loadUsers();
      setFormData({ email: '', password: '', fullName: '', role: 'cashier' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Cet email est déjà utilisé');
      } else {
        toast.error('Erreur lors de la création de l\'utilisateur');
      }
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: string | null) {
    if (currentRole !== 'admin') {
      toast.error("Vous n'avez pas la permission de modifier les utilisateurs");
      return;
    }

    if (userId === currentUser?.id) {
      toast.error('Vous ne pouvez pas désactiver votre propre compte');
      return;
    }

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Statut mis à jour');
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  const getRoleBadge = (role?: string) => {
    const roleMap = {
      admin: { label: 'Administrateur', color: 'default' as const },
      manager: { label: 'Gestionnaire', color: 'secondary' as const },
      cashier: { label: 'Caissier', color: 'outline' as const },
      driver: { label: 'Chauffeur', color: 'outline' as const },
    };
    return roleMap[role as keyof typeof roleMap] || { label: 'Aucun rôle', color: 'outline' as const };
  };

  // Check if current user has permission to manage users
  if (roleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (currentRole !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">Gérez les utilisateurs et leurs permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="manager">Gestionnaire</SelectItem>
                    <SelectItem value="driver">Chauffeur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">Créer l'utilisateur</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôle:</span>
                  <Badge variant={getRoleBadge(user.role).color}>
                    {getRoleBadge(user.role).label}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant={user.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={() => toggleUserStatus(user.id, user.status)}
                  disabled={user.id === currentUser?.id}
                >
                  {user.status === 'active' ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
