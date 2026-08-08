import { FC } from "react";
import { useNavigate } from "react-router";
import { usePesertaExams, PesertaExam } from "../../../hooks/peserta/usePesertaExams";
import { useAuthUser } from "../../../hooks/auth/useAuthUser";
import { usePagination } from "../../../hooks/usePagination";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import { Clock, Layers, Play, ArrowRight, RotateCw } from "lucide-react";

const PesertaExams: FC = () => {
  const { data: exams, isLoading, isError, error } = usePesertaExams();
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<PesertaExam>(exams, {
      searchBy: (e, q) => (e.title.toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q)),
    });
  const user = useAuthUser();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const getStatusBadge = (exam: PesertaExam) => {
    if (!exam.session) {
      return (
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          Belum dikerjakan
        </span>
      );
    }
    if (exam.session.status === 'in_progress') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          Sedang berjalan
        </span>
      );
    }
    if (exam.results_published) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
          Nilai tersedia
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
        Selesai (menunggu nilai)
      </span>
    );
  };

  const getStatusLabel = (exam: PesertaExam) => {
    if (!exam.session) return 'Belum dikerjakan';
    if (exam.session.status === 'in_progress') return 'Lanjutkan';
    if (exam.results_published) return 'Lihat Hasil';
    return 'Selesai (menunggu nilai)';
  };

  const handleAction = async (exam: PesertaExam) => {
    if (!exam.session) {
      const ok = await confirm({
        title: "Mulai ujian",
        description: `Mulai ujian "${exam.title}"? Setelah dimulai, ujian tidak bisa diulang.`,
        confirmLabel: "Mulai",
      });
      if (!ok) return;
      navigate(`/peserta/exams/${exam.id}/take`);
    } else if (exam.session.status === 'in_progress') {
      navigate(`/peserta/exams/${exam.id}/take`);
    } else {
      navigate(`/peserta/exams/${exam.id}/result`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Ujian</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Halo, <span className="font-medium text-foreground">{user?.name}</span>. Pilih ujian di bawah untuk memulai.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">Error: {error.message}</CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari mata ujian..."
            className="mb-5 w-full sm:max-w-xs"
          />
          {search && (
            <p className="mb-3 text-xs text-muted-foreground">
              {totalItems} hasil untuk "{search}"
            </p>
          )}
          {items.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada ujian yang tersedia untuk Anda."}
              </CardContent>
            </Card>
          )}
        <div className="space-y-4">
          {items.map((exam: PesertaExam, index) => (
            <Card key={exam.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                  {startIndex + index}
                </span>
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">{exam.title}</h2>
                    {exam.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        <Layers className="size-3.5" /> {exam.section_count} sesi
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        <Clock className="size-3.5" /> {exam.total_duration_minutes} menit
                      </span>
                      {getStatusBadge(exam)}
                      {exam.session && exam.results_published && exam.session.total_score !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          Nilai: {exam.session.total_score}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => handleAction(exam)}>
                    {!exam.session ? <Play className="size-4" /> : exam.session.status === 'in_progress' ? <RotateCw className="size-4" /> : <ArrowRight className="size-4" />}
                    {getStatusLabel(exam)}
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {!isLoading && !isError && exams && exams.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          className="mt-6"
        />
      )}
    </div>
  )
}

export default PesertaExams;