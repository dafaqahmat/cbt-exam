import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate } from "react-router";
import { useExamCreate } from "../../../hooks/exam/useExamCreate";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ExamsCreate: FC = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useExamCreate();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    mutate({ title, description, status }, {
      onSuccess: () => {
        toast.success("Ujian berhasil dibuat");
        navigate('/admin/exams');
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <AdminLayout
      title="Tambah Ujian"
      description="Buat ujian baru untuk peserta."
      actions={
        <Link to="/admin/exams">
          <Button variant="outline">Batal</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul ujian"
              />
              {errors.Title && <p className="text-xs text-destructive">{errors.Title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi ujian"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v != null && setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Link to="/admin/exams">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default ExamsCreate;