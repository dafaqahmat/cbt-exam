import { FC, useState } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionUpdate } from "../../../hooks/question/useQuestionUpdate";
import { QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { useQuestionById } from "../../../hooks/question/useQuestionById";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const QuestionsEdit: FC = () => {
  const { id } = useParams();
  const questionId = Number(id);
  const navigate = useNavigate();

  const { data: question, isLoading, isError, error } = useQuestionById(questionId);
  const { mutate, isPending } = useQuestionUpdate();
  const { data: exams } = useAdminExams();
  const exam = exams?.find((e) =>
    (e.sections ?? []).some((s) => s.id === question?.section_id)
  );
  const isActive = exam?.status === 'active';
  const isClosed = exam?.status === 'closed';
  const isLocked = isActive || isClosed;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (data: QuestionRequest) => {
    mutate({ id: questionId, data }, {
      onSuccess: () => {
        toast.success("Soal berhasil diperbarui");
        navigate(-1);
      },
      onError: (err) => {
        setErrors(getValidationErrors(err));
      }
    });
  };

  const initialForm: QuestionRequest | null = question ? {
    question_text: question.question_text,
    question_image: question.question_image,
    option_a_text: question.option_a_text,
    option_a_image: question.option_a_image,
    option_b_text: question.option_b_text,
    option_b_image: question.option_b_image,
    option_c_text: question.option_c_text,
    option_c_image: question.option_c_image,
    option_d_text: question.option_d_text,
    option_d_image: question.option_d_image,
    correct_answer: question.correct_answer,
    points: question.points,
  } : null;

  return (
    <AdminLayout
      title="Edit Soal"
      description="Perbarui detail soal."
      actions={
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Kembali
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
          {isError && <p className="text-sm text-destructive">Error: {error.message}</p>}
          {initialForm && (
            <>
              {isActive && (
                <p className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Ujian sedang aktif, soal tidak dapat diubah. Nonaktifkan dulu lewat <strong>"Ubah ke Draft"</strong> pada daftar soal.
                </p>
              )}
              {isClosed && (
                <p className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Ujian telah ditutup (Closed), soal tidak dapat diubah.
                </p>
              )}
              <QuestionForm
                key={question!.id}
                initial={initialForm}
                errors={errors}
                submitLabel="Perbarui"
                isPending={isPending}
                disabled={isLocked}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default QuestionsEdit;