import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate } from "react-router";
import { useUserCreate } from "../../../hooks/user/useUserCreate";
import { useCategories } from "../../../hooks/category/useCategories";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/common/PasswordInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const UsersCreate: FC = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useUserCreate();
  const { data: categories } = useCategories();

  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      name, username, email, password, role: 'peserta',
      category_id: Number(categoryId),
    }, {
      onSuccess: () => {
        toast.success("User berhasil dibuat");
        navigate('/admin/users');
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <AdminLayout
      title="Tambah Peserta"
      description="Buat akun peserta baru."
      actions={
        <Link to="/admin/users">
          <Button variant="outline">Batal</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-6">
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
              <Label htmlFor="password">Password (min. 6 karakter)</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                autoComplete="new-password"
              />
              {errors.Password && <p className="text-xs text-destructive">{errors.Password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Kategori (wajib)</Label>
              <Select value={categoryId} onValueChange={(v) => v != null && setCategoryId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(categories ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada kategori. Tambah dulu di <Link to="/admin/categories" className="underline">Kelola Kategori</Link>.
                </p>
              )}
              {errors.CategoryId && <p className="text-xs text-destructive">{errors.CategoryId}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Link to="/admin/users">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default UsersCreate;