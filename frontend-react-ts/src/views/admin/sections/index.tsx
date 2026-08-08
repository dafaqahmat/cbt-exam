import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useParams } from "react-router";
import { useSections, Section } from "../../../hooks/section/useSections";
import { useSectionCreate, SectionRequest } from "../../../hooks/section/useSectionCreate";
import { useSectionUpdate } from "../../../hooks/section/useSectionUpdate";
import { useSectionDelete } from "../../../hooks/section/useSectionDelete";
import { usePagination } from "../../../hooks/usePagination";
import { useQueryClient } from '@tanstack/react-query';
import { getValidationErrors } from '../../../services/errors';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import { ArrowLeft, Pencil, Trash2, ListChecks, Loader2 } from "lucide-react";

const emptyForm: SectionRequest = {
  title: '',
  order: 1,
  duration_minutes: 30,
  break_after_seconds: 0,
};

type SectionFormRequest = {
  title: string;
  order: number;
  duration_minutes: number;
  break_after_seconds: number;
};

const SectionsIndex: FC = () => {
  const { id } = useParams();
  const examId = Number(id);

  const { data: sections, isLoading, isError, error } = useSections(examId);
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<Section>(sections, {
      searchBy: (s, q) => s.title.toLowerCase().includes(q),
    });
  const queryClient = useQueryClient();

  const { mutate: createSection, isPending: creating } = useSectionCreate();
  const { mutate: updateSection, isPending: updating } = useSectionUpdate();
  const { mutate: deleteSection } = useSectionDelete();

  const [form, setForm] = useState<SectionFormRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sections', examId] });
    queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
  };

  const handleChange = (field: keyof SectionFormRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = (payload: SectionRequest) => {
    const onSuccess = () => {
      setForm(emptyForm);
      setEditingId(null);
      setErrors({});
      invalidate();
      toast.success(editingId !== null ? "Sesi berhasil diperbarui" : "Sesi berhasil dibuat");
    };
    const onError = (err: unknown) => {
      setErrors(getValidationErrors(err));
    };

    if (editingId !== null) {
      updateSection({ id: editingId, data: payload }, { onSuccess, onError });
    } else {
      createSection({ examId, data: payload }, { onSuccess, onError });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitForm({ ...form });
  };

  const handleEdit = (section: Section) => {
    setEditingId(section.id);
    setForm({
      title: section.title,
      order: section.order,
      duration_minutes: section.duration_minutes,
      break_after_seconds: section.break_after_seconds,
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleDelete = async (sectionId: number, sectionTitle: string) => {
    const ok = await confirm({
      title: "Hapus sesi",
      description: `Yakin ingin menghapus sesi "${sectionTitle}"? Semua soal di dalamnya ikut terhapus.`,
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;

    deleteSection(sectionId, {
      onSuccess: () => {
        invalidate();
        toast.success("Sesi berhasil dihapus");
      },
      onError: () => toast.error("Gagal menghapus sesi"),
    });
  };

  const isBusy = creating || updating;

  return (
    <AdminLayout
      title={editingId !== null ? "Edit Sesi" : "Tambah Sesi"}
      description="Atur sesi ujian, durasi, dan waktu istirahat."
      actions={
        <Link to="/admin/exams">
          <Button variant="outline"><ArrowLeft className="size-4" /> Kembali ke Ujian</Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Form Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="section-title">Judul Sesi</Label>
                <Input
                  id="section-title"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Contoh: Sesi 1 - Penalaran"
                />
                {errors.Title && <p className="text-xs text-destructive">{errors.Title}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="section-order">Urutan</Label>
                <Input
                  id="section-order"
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(e) => handleChange('order', Number(e.target.value))}
                />
                {errors.Order && <p className="text-xs text-destructive">{errors.Order}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="section-duration">Durasi (menit)</Label>
                <Input
                  id="section-duration"
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => handleChange('duration_minutes', Number(e.target.value))}
                />
                {errors.DurationMinutes && <p className="text-xs text-destructive">{errors.DurationMinutes}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="section-break">Istirahat Setelahnya (detik)</Label>
                <Input
                  id="section-break"
                  type="number"
                  min={0}
                  value={form.break_after_seconds}
                  onChange={(e) => handleChange('break_after_seconds', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">0 = tanpa istirahat</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isBusy}>
                  {isBusy && <Loader2 className="size-4 animate-spin" />}
                  {isBusy ? 'Menyimpan...' : (editingId !== null ? 'Perbarui' : 'Simpan')}
                </Button>
                {editingId !== null && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Batal</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daftar Sesi</CardTitle>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari judul sesi..."
              className="w-full sm:max-w-xs"
            />
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {isError && (
              <p className="p-6 text-sm text-destructive">Error: {error.message}</p>
            )}
            {!isLoading && !isError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-16 text-center">Urutan</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead className="text-center">Durasi</TableHead>
                    <TableHead className="text-center">Istirahat</TableHead>
                    <TableHead className="text-center">Soal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                        {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada sesi."}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((section, index) => (
                    <TableRow key={section.id}>
                      <TableCell className="text-center text-muted-foreground">{startIndex + index}</TableCell>
                      <TableCell className="text-center font-medium">{section.order}</TableCell>
                      <TableCell className="font-medium">{section.title}</TableCell>
                      <TableCell className="text-center">{section.duration_minutes} menit</TableCell>
                      <TableCell className="text-center">
                        {section.break_after_seconds > 0 ? `${section.break_after_seconds} detik` : '-'}
                      </TableCell>
                      <TableCell className="text-center">{section.question_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/sections/${section.id}/questions`}>
                            <Button variant="outline" size="sm"><ListChecks className="size-3.5" /> Soal</Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(section.id, section.title)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && !isError && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={goToPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default SectionsIndex;