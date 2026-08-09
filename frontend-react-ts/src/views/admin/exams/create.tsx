import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate } from "react-router";
import { useExamCreate } from "../../../hooks/exam/useExamCreate";
import { useCategories } from "../../../hooks/category/useCategories";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const ExamsCreate: FC = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useExamCreate();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (categoryIds.length === 0) {
      setErrors({ CategoryIds: 'Pilih minimal satu kategori peserta' });
      return;
    }

    mutate({ title, description, status: 'draft', category_ids: categoryIds }, {
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
                <Label>Kategori Peserta (wajib)</Label>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((cat) => (
                  <Label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-1.5 font-normal has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <Checkbox
                      checked={categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    {cat.name}
                  </Label>
                ))}
              </div>
              {(categories ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada kategori. Tambah dulu di <Link to="/admin/categories" className="underline">Kelola Kategori</Link>.
                </p>
              )}
              {errors.CategoryIds && <p className="text-xs text-destructive">{errors.CategoryIds}</p>}
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