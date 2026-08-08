import { FC, useState, type FormEvent, useEffect } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate, useParams } from "react-router";
import { useUserById } from "../../../hooks/user/useUserById";
import { useUserUpdate } from "../../../hooks/user/useUserUpdate";
import { useCategories } from "../../../hooks/category/useCategories";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/common/PasswordInput";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const UsersEdit: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const { data: user, isLoading } = useUserById(userId);
  const { mutate, isPending } = useUserUpdate();
  const { data: categories } = useCategories();

  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setCategoryId(user.category_id != null ? String(user.category_id) : '');
    }
  }, [user]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      setErrors({ CategoryId: 'Kategori wajib dipilih' });
      return;
    }

    if (!email.trim()) {
      setErrors({ Email: 'Email wajib diisi' });
      return;
    }

    mutate({
      id: userId,
      data: {
        name, username, email, password, role: 'peserta',
        category_id: Number(categoryId),
      }
    }, {
      onSuccess: () => {
        toast.success("User berhasil diperbarui");
        navigate('/admin/users');
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <AdminLayout
      title="Edit Peserta"
      description="Perbarui data akun peserta."
      actions={
        <Link to="/admin/users">
          <Button variant="outline">Batal</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
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
                <Label htmlFor="email">Email (wajib)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
                {errors.Email && <p className="text-xs text-destructive">{errors.Email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password (kosongkan jika tidak diubah)</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password baru"
                  autoComplete="new-password"
                />
                {errors.Password && <p className="text-xs text-destructive">{errors.Password}</p>}
              </div>

<div className="space-y-1.5">
              <Label>Kategori (wajib)</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => v != null && setCategoryId(v)}
                items={Object.fromEntries((categories ?? []).map((cat) => [String(cat.id), cat.name]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.CategoryId && <p className="text-xs text-destructive">{errors.CategoryId}</p>}
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? 'Menyimpan...' : 'Perbarui'}
                </Button>
                <Link to="/admin/users">
                  <Button type="button" variant="outline">Batal</Button>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default UsersEdit;