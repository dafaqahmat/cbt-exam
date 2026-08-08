import { FC, useState, useContext, type FormEvent } from 'react';
import { useNavigate } from "react-router";
import { useLogin } from "../../hooks/auth/useLogin";
import Cookies from 'js-cookie'
import { AuthContext } from '../../context/AuthContext';
import { getValidationErrors } from '../../services/errors';
import { toast } from 'sonner';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/common/PasswordInput';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Login: FC = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useLogin();
  const { setIsAuthenticated } = useContext(AuthContext)!;

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();

    mutate({ username, password }, {
      onSuccess: (data) => {
        Cookies.set('token', data.data.token);
        Cookies.set('user', JSON.stringify({
          id: data.data.id,
          name: data.data.name,
          username: data.data.username,
          email: data.data.email,
          role: data.data.role
        }));

        setIsAuthenticated(true);
        toast.success(`Selamat datang, ${data.data.name}!`);

        if (data.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/peserta/exams');
        }
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="size-9" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            CBT<span className="text-brand-gradient"> Exam</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan masuk untuk memulai.
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Masuk</CardTitle>
            <CardDescription>Gunakan akun yang sudah terdaftar.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.Error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Gagal masuk</AlertTitle>
                <AlertDescription>{errors.Error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                {errors.Password && <p className="text-xs text-destructive">{errors.Password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login;