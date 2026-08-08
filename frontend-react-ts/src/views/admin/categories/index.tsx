import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { useCategories, Category } from "../../../hooks/category/useCategories";
import { useCategoryCreate } from "../../../hooks/category/useCategoryCreate";
import { useCategoryUpdate } from "../../../hooks/category/useCategoryUpdate";
import { useCategoryDelete } from "../../../hooks/category/useCategoryDelete";
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { usePagination } from "../../../hooks/usePagination";
import { Loader2, Pencil, Plus, Tags, Trash2, X } from "lucide-react";

const CategoriesIndex: FC = () => {
  const { data: categories, isLoading, isError, error } = useCategories();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<Category>(categories, {
      searchBy: (c, q) => c.name.toLowerCase().includes(q),
    });

  const { mutate: createMutate, isPending: createPending } = useCategoryCreate();
  const { mutate: updateMutate, isPending: updatePending } = useCategoryUpdate();
  const { mutate: deleteMutate, isPending: deletePending } = useCategoryDelete();

  const [name, setName] = useState<string>('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invalidateAndToast = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success(message);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { name };
    if (editing) {
      updateMutate({ id: editing.id, data: payload }, {
        onSuccess: () => {
          invalidateAndToast("Kategori berhasil diperbarui");
          setEditing(null);
          setName('');
          setErrors({});
        },
        onError: (err) => setErrors(getValidationErrors(err)),
      });
    } else {
      createMutate(payload, {
        onSuccess: () => {
          invalidateAndToast("Kategori berhasil ditambah");
          setName('');
          setErrors({});
        },
        onError: (err) => setErrors(getValidationErrors(err)),
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setName('');
    setErrors({});
  };

  const handleDelete = async (category: Category) => {
    const ok = await confirm({
      title: "Hapus kategori",
      description: `Yakin ingin menghapus "${category.name}"? Peserta dengan kategori ini akan menjadi tanpa kategori.`,
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;

    deleteMutate(category.id, {
      onSuccess: () => invalidateAndToast("Kategori berhasil dihapus"),
      onError: () => toast.error("Gagal menghapus kategori"),
    });
  };

  const isPending = createPending || updatePending || deletePending;

  return (
    <AdminLayout
      title="Kelola Kategori"
      description="Kelola kategori peserta, mis. Kelas 10, Perekrutan PT, dan lainnya."
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold">
              {editing ? `Edit Kategori: ${editing.name}` : "Tambah Kategori"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Siswa Kelas 10, Perekrutan PT"
                />
                {errors.Name && <p className="text-xs text-destructive">{errors.Name}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {editing ? (
                    <>Perbarui</>
                  ) : (
                    <><Plus className="size-4" /> Tambah</>
                  )}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    <X className="size-4" /> Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari nama kategori..."
                className="w-full sm:max-w-xs"
              />
              {search && (
                <p className="text-xs text-muted-foreground">
                  {totalItems} hasil untuk "{search}"
                </p>
              )}
            </div>
            {isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                        {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada kategori."}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-center text-muted-foreground">{startIndex + index}</TableCell>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Tags className="size-3.5 text-muted-foreground" />
                          {category.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="size-3.5" /> Hapus
                        </Button>
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

export default CategoriesIndex;