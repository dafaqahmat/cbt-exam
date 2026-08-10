import { FC, useMemo, useState } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useParams } from "react-router";
import { useAdminResults, AdminResultItem } from "../../../hooks/result/useAdminResults";
import { useSessionAnswers, AnswerReviewItem } from "../../../hooks/result/useSessionAnswers";
import { usePagination } from "../../../hooks/usePagination";
import { useExamPublish } from "../../../hooks/exam/useExamPublish";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { imageUrl } from "../../../services/api";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ArrowLeft, Send, Eye, Download } from "lucide-react";

const AnswersModal: FC<{ sessionId: number, onClose: () => void }> = ({ sessionId, onClose }) => {
  const { data, isLoading, isError, error } = useSessionAnswers(sessionId, true);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail Jawaban (Nilai: {data?.total_score ?? '-'})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {isError && <p className="text-sm text-destructive">Error: {error.message}</p>}
          {data?.answers.map((answer: AnswerReviewItem, index: number) => (
            <div
              key={answer.question_id}
              className={`rounded-lg border p-3 ${answer.is_correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-destructive/40 bg-destructive/5'}`}
            >
              <div className="flex items-center justify-between text-sm">
                <strong>#{index + 1}</strong>
                <span className="text-muted-foreground">
                  Jawaban: <strong className="text-foreground">{answer.selected_option || '-'}</strong>
                  {" | "}
                  Kunci: <strong className="text-foreground">{answer.correct_answer}</strong>
                  {" | "}
                  <span className={answer.is_correct ? 'text-emerald-600' : 'text-destructive'}>
                    {answer.is_correct ? 'BENAR' : 'SALAH'}
                  </span>
                </span>
              </div>
              {answer.question_text && <p className="mt-2 text-sm">{answer.question_text}</p>}
              {answer.question_image && (
                <img src={imageUrl(answer.question_image)} alt="soal" className="mt-2 max-h-28 rounded border object-contain" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ResultsIndex: FC = () => {
  const { id } = useParams();
  const examId = Number(id);

  const { data, isLoading, isError, error } = useAdminResults(examId);
  const queryClient = useQueryClient();
  const { mutate: publish, isPending: publishing } = useExamPublish();
  const confirm = useConfirm();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const SCORE_FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'best', label: 'Nilai Terbaik' },
    { key: 'worst', label: 'Nilai Terendah' },
  ] as const;
  type ScoreFilter = typeof SCORE_FILTERS[number]['key'];
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');

  const handlePublish = async () => {
    const ok = await confirm({
      title: "Publikasikan hasil",
      description: "Publikasikan hasil ujian ini? Peserta akan bisa melihat nilainya.",
      confirmLabel: "Publikasikan",
    });
    if (!ok) return;

    publish(examId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-results', examId] });
        queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
        toast.success("Hasil berhasil dipublikasikan");
      },
      onError: () => toast.error("Gagal mempublikasikan hasil"),
    });
  };

  const exam = data?.exam;
  const results = useMemo(() => data?.results ?? [], [data?.results]);

  const finishedScores = useMemo(
    () => results.filter((r) => r.status === 'finished' && r.total_score !== null).map((r) => r.total_score as number),
    [results]
  );
  const highest = finishedScores.length > 0 ? Math.max(...finishedScores) : null;
  const lowest = finishedScores.length > 0 ? Math.min(...finishedScores) : null;

  const filteredResults = useMemo(() => {
    if (scoreFilter === 'best' || scoreFilter === 'worst') {
      const finished = results.filter((r) => r.status === 'finished' && r.total_score !== null);
      return [...finished].sort((a, b) => {
        const diff = (a.total_score ?? 0) - (b.total_score ?? 0);
        return scoreFilter === 'best' ? -diff : diff;
      });
    }
    return results;
  }, [results, scoreFilter]);

  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<AdminResultItem>(filteredResults, {
      searchBy: (r, q) =>
        r.user.name.toLowerCase().includes(q) ||
        r.user.username.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    });

  const csvCell = (value: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCSV = () => {
    const rows = filteredResults;
    if (rows.length === 0) {
      toast.info("Tidak ada data untuk diekspor");
      return;
    }

    const sectionTitles = rows[0]?.sections.map((s) => s.title) ?? [];
    const header = ['No', 'Nama', 'Username', 'Email', 'Status', 'Nilai Total', 'Pelanggaran', ...sectionTitles.map((_, i) => `Nilai Sesi ${i + 1}`)];

    const lines = rows.map((r, index) => [
      index + 1,
      r.user.name,
      r.user.username,
      r.user.email,
      r.status,
      r.total_score ?? '',
      r.violation_count,
      ...r.sections.map((s) => s.score ?? ''),
    ]);

    const csv = [header, ...lines].map((row) => row.map(csvCell).join(',')).join('\r\n');

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hasil-ujian-${(exam?.title ?? `exam-${examId}`).replace(/[^a-z0-9]+/gi, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Laporan ${rows.length} peserta diunduh`);
  };

  return (
    <AdminLayout
      title={`Hasil Ujian${exam ? `: ${exam.title}` : ''}`}
      description="Ringkasan nilai peserta dan detail jawaban."
      actions={
        <>
          <Button variant="outline" onClick={exportCSV} disabled={isLoading || results.length === 0}>
            <Download className="size-4" /> Download Laporan
          </Button>
          {!exam?.results_published && (
            <Button onClick={handlePublish} disabled={isLoading || publishing}>
              <Send className="size-4" /> {publishing ? 'Memublikasikan...' : 'Publish Hasil'}
            </Button>
          )}
          <Link to="/admin/exams">
            <Button variant="outline"><ArrowLeft className="size-4" /> Kembali</Button>
          </Link>
        </>
      }
    >
      {isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">Error: {error.message}</CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          {exam?.results_published && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              Hasil ujian ini sudah dipublikasikan. Peserta dapat melihat nilainya.
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Data Peserta</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex gap-1 rounded-lg bg-muted p-1">
                    {SCORE_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setScoreFilter(f.key)}
                        className={
                          scoreFilter === f.key
                            ? 'rounded-md bg-background px-3 py-1 text-xs font-medium shadow-sm'
                            : 'rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground'
                        }
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Cari nama atau username peserta..."
                    className="w-full sm:max-w-xs"
                  />
                </div>
              </div>
              {finishedScores.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Peserta selesai: <span className="font-semibold text-foreground">{finishedScores.length}</span>
                  {" • "}Nilai tertinggi: <span className="font-semibold text-emerald-600">{highest}</span>
                  {" • "}Nilai terendah: <span className="font-semibold text-destructive">{lowest}</span>
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Nilai Total</TableHead>
                    <TableHead className="text-center">Pelanggaran</TableHead>
                    <TableHead>Nilai Per Sesi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                        {scoreFilter !== 'all' && filteredResults.length === 0
                          ? "Belum ada peserta yang selesai dan memiliki nilai."
                          : results.length === 0
                            ? "Belum ada peserta yang mengerjakan ujian ini."
                            : `Tidak ada hasil untuk "${search}".`}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((result: AdminResultItem, index) => (
                    <TableRow key={result.session_id}>
                      <TableCell className="text-center text-muted-foreground">{startIndex + index}</TableCell>
                      <TableCell>
                        <div className="font-medium">{result.user.name}</div>
                        <div className="text-xs text-muted-foreground">{result.user.username}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={result.status} /></TableCell>
                      <TableCell className="text-center font-bold">{result.total_score ?? '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className={result.violation_count > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
                          {result.violation_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {result.sections.map((s) => (
                            <div key={s.section_id} className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{s.order}. {s.title}:</span> {s.score ?? '-'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSession(result.session_id)}>
                          <Eye className="size-3.5" /> Jawaban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={goToPage}
              />
            </CardContent>
          </Card>
        </>
      )}

      {selectedSession !== null && (
        <AnswersModal sessionId={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </AdminLayout>
  )
}

export default ResultsIndex;