import { FC, useState, type FormEvent, useEffect } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { useProfile } from "../../../hooks/user/useProfile";
import { useProfileUpdate } from "../../../hooks/user/useProfileUpdate";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/common/PasswordInput";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const AdminProfile: FC = () => {
  const { data: profile, isLoading, isError, error } = useProfile();
  const { mutate, isPending } = useProfileUpdate();

  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setUsername(profile.username);
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    mutate({ name, username, email, password: password || undefined }, {
      onSuccess: (data) => {
        Cookies.set('user', JSON.stringify({
          id: data.data.id,
          name: data.data.name,
          username: data.data.username,
          email: data.data.email,
          role: data.data.role,
        }));
        setPassword('');
        toast.success("Profil berhasil diperbarui");
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <AdminLayout
      title="Edit Profil"
      description="Perbarui informasi akun admin Anda."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Akun</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {isError && <p className="text-sm text-destructive">Error: {error.message}</p>}
          {profile && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                />
                {errors.Name && <p className="text-xs text-destructive">{errors.Name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
                {errors.Username && <p className="text-xs text-destructive">{errors.Username}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
                {errors.Email && <p className="text-xs text-destructive">{errors.Email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password Baru (kosongkan jika tidak diubah)</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password baru"
                  autoComplete="new-password"
                />
                {errors.Password && <p className="text-xs text-destructive">{errors.Password}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default AdminProfile;