import { FC } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link } from "react-router";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { useExamDelete } from "../../../hooks/exam/useExamDelete";
import { usePagination } from "../../../hooks/usePagination";
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, ListChecks, Eye } from "lucide-react";

const ExamsIndex: FC = () => {
  const { data: exams, isLoading, isError, error } = useAdminExams();
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination(exams, {
      searchBy: (e, q) => e.title.toLowerCase().includes(q),
    });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useExamDelete();
  const confirm = useConfirm();

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm({
      title: "Hapus ujian",
      description: `Yakin ingin menghapus "${title}"? Semua sesi & soal terkait ikut terhapus.`,
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;

    mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
        toast.success("Ujian berhasil dihapus");
      },
      onError: () => toast.error("Gagal menghapus ujian"),
    });
  }

  return (
    <AdminLayout
      title="Kelola Ujian"
      description="Buat dan atur ujian beserta sesi serta soalnya."
      actions={
        <Link to="/admin/exams/create">
          <Button><Plus className="size-4" /> Tambah Ujian</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari judul ujian..."
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
              {Array.from({ length: 5 }).map((_, i) => (
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
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Sesi</TableHead>
                  <TableHead className="text-center">Soal</TableHead>
                  <TableHead className="text-center">Peserta</TableHead>
                  <TableHead>Hasil</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">
                      {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada ujian."}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((exam, index) => (
                  <TableRow key={exam.id}>
                    <TableCell className="text-center text-muted-foreground">{startIndex + index}</TableCell>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(exam.categories ?? []).map((cat) => (
                          <span
                            key={cat.id}
                            className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={exam.status} /></TableCell>
                    <TableCell className="text-center">{exam.section_count}</TableCell>
                    <TableCell className="text-center">{exam.question_count}</TableCell>
                    <TableCell className="text-center">{exam.participant_count}</TableCell>
                    <TableCell>
                      <StatusBadge status={exam.results_published ? 'published' : 'not_published'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/exams/${exam.id}/sections`}>
                          <Button variant="outline" size="sm"><ListChecks className="size-3.5" /> Sesi</Button>
                        </Link>
                        <Link to={`/admin/exams/${exam.id}/results`}>
                          <Button variant="outline" size="sm"><Eye className="size-3.5" /> Hasil</Button>
                        </Link>
                        <Link to={`/admin/exams/edit/${exam.id}`}>
                          <Button variant="outline" size="sm"><Pencil className="size-3.5" /> Edit</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={isPending || exam.status === 'active'}
                          title={exam.status === 'active' ? 'Ujian aktif tidak dapat dihapus. Ubah ke Closed atau Draft terlebih dahulu.' : undefined}
                          onClick={() => handleDelete(exam.id, exam.title)}
                        >
                          <Trash2 className="size-3.5" /> Hapus
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
    </AdminLayout>
  )
}

export default ExamsIndex;