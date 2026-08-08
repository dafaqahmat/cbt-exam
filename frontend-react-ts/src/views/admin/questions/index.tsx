import { FC } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useParams } from "react-router";
import { useAdminQuestions, Question } from "../../../hooks/question/useAdminQuestions";
import { useQuestionDelete } from "../../../hooks/question/useQuestionDelete";
import { usePagination } from "../../../hooks/usePagination";
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import { imageUrl } from "../../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import { ArrowLeft, Plus, Pencil, Trash2, Check } from "lucide-react";

const OPTION_KEYS = ["a", "b", "c", "d"] as const;

const QuestionsIndex: FC = () => {
  const { id } = useParams();
  const sectionId = Number(id);

  const { data: questions, isLoading, isError, error } = useAdminQuestions(sectionId);
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<Question>(questions, {
      searchBy: (q, query) =>
        (q.question_text || "").toLowerCase().includes(query) ||
        q.type.toLowerCase().includes(query) ||
        q.correct_answer.toLowerCase().includes(query),
    });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useQuestionDelete();
  const confirm = useConfirm();

  const handleDelete = async (questionId: number) => {
    const ok = await confirm({
      title: "Hapus soal",
      description: "Yakin ingin menghapus soal ini?",
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;

    mutate(questionId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-questions', sectionId] });
        toast.success("Soal berhasil dihapus");
      },
      onError: () => toast.error("Gagal menghapus soal"),
    });
  };

  return (
    <AdminLayout
      title="Kelola Soal"
      description="Daftar soal pada sesi ini."
      actions={
        <>
          <Link to={`/admin/sections/${sectionId}/questions/create`}>
            <Button><Plus className="size-4" /> Tambah Soal</Button>
          </Link>
          <Link to="/admin/exams">
            <Button variant="outline"><ArrowLeft className="size-4" /> Kembali</Button>
          </Link>
        </>
      }
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <p className="text-sm text-destructive">Error: {error.message}</p>
      )}
      {!isLoading && !isError && (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari teks soal, tipe, atau kunci jawaban..."
            className="mb-4 w-full sm:max-w-xs"
          />
          {search && (
            <p className="mb-4 text-xs text-muted-foreground">
              {totalItems} hasil untuk "{search}"
            </p>
          )}
          {items.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                {search
                  ? `Tidak ada hasil untuk "${search}".`
                  : 'Belum ada soal di sesi ini. Klik "Tambah Soal" untuk membuatnya.'}
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
          {items.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                      #{startIndex + index}
                    </span>
                    <Badge variant="secondary">{question.type}</Badge>
                    <Badge variant="secondary">Kunci: {question.correct_answer}</Badge>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      {question.points} poin
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/admin/questions/${question.id}/edit`}>
                      <Button variant="outline" size="sm"><Pencil className="size-3.5" /> Edit</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="size-3.5" /> Hapus
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {question.question_text && <p className="font-medium">{question.question_text}</p>}
                  {question.question_image && (
                    <img
                      src={imageUrl(question.question_image)}
                      alt="soal"
                      className="mt-1 max-h-40 rounded-lg border object-contain"
                    />
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {OPTION_KEYS.map((opt) => {
                    const text = question[`option_${opt}_text` as keyof Question] as string;
                    const img = question[`option_${opt}_image` as keyof Question] as string;
                    const isCorrect = question.correct_answer === opt.toUpperCase();
                    return (
                      <div
                        key={opt}
                        className={`rounded-lg border p-2.5 ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-muted/30'}`}
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          {isCorrect && <Check className="size-3.5 text-emerald-600" />}
                          {opt.toUpperCase()}.
                        </div>
                        {text && <p className="mt-1 text-sm">{text}</p>}
                        {img && (
                          <img src={imageUrl(img)} alt={`opsi ${opt}`} className="mt-1 max-h-16 rounded border object-contain" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          </div>
        </>
      )}

      {!isLoading && !isError && questions && questions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          className="mt-4"
        />
      )}
    </AdminLayout>
  )
}

export default QuestionsIndex;