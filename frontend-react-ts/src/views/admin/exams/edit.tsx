import { FC, useState, type FormEvent, useEffect } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate, useParams } from "react-router";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { useExamUpdate } from "../../../hooks/exam/useExamUpdate";
import { useCategories } from "../../../hooks/category/useCategories";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ExamsEdit: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const examId = Number(id);

  const { data: exams, isLoading } = useAdminExams();
  const exam = exams?.find((e) => e.id === examId);
  const { mutate, isPending } = useExamUpdate();
  const { data: categories } = useCategories();
  const confirm = useConfirm();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('draft');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (exam) {
      setTitle(exam.title);
      setDescription(exam.description);
      setStatus(exam.status);
      setCategoryIds((exam.categories ?? []).map((c) => c.id));
    }
  }, [exam]);

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const hasSessions = (exam?.section_count ?? 0) > 0;
  const hasQuestions = (exam?.question_count ?? 0) > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (categoryIds.length === 0) {
      setErrors({ CategoryIds: 'Pilih minimal satu kategori peserta' });
      return;
    }

    if (status === 'active' && (!hasSessions || !hasQuestions)) {
      setErrors({ Status: 'Sesi dan soal masih kosong' });
      return;
    }

    setErrors({});

    if (exam?.status !== status) {
      if (status === 'draft') {
        const ok = await confirm({
          title: "Ubah ke Draft?",
          description: "Seluruh progres peserta akan dihapus dan peserta harus mengulang ujian dari 0.",
          confirmLabel: "Ya, ubah ke Draft",
          destructive: true,
        });
        if (!ok) return;
      } else if (status === 'closed') {
        const ok = await confirm({
          title: "Tutup ujian?",
          description: "Peserta yang sedang mengerjakan akan dihentikan secara otomatis.",
          confirmLabel: "Ya, tutup ujian",
        });
        if (!ok) return;
      }
    }

    mutate({ id: examId, data: { title, description, status, category_ids: categoryIds } }, {
      onSuccess: () => {
        toast.success("Ujian berhasil diperbarui");
        navigate('/admin/exams');
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    })
  }

  return (
    <AdminLayout
      title="Edit Ujian"
      description="Perbarui data ujian."
      actions={
        <Link to="/admin/exams">
          <Button variant="outline">Batal</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
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
                <p className="text-xs text-muted-foreground">
                  {hasSessions && hasQuestions
                    ? `Siap diaktifkan (${exam?.section_count} sesi, ${exam?.question_count} soal).`
                    : 'Ujian harus punya minimal 1 sesi dan 1 soal sebelum bisa diaktifkan.'}
                </p>
                {errors.Status && <p className="text-xs text-destructive">{errors.Status}</p>}
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
                  {isPending ? 'Menyimpan...' : 'Perbarui'}
                </Button>
                <Link to="/admin/exams">
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

export default ExamsEdit;