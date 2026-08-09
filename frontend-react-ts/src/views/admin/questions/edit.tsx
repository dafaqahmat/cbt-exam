import { FC, useState } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionUpdate } from "../../../hooks/question/useQuestionUpdate";
import { QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { useQuestionById } from "../../../hooks/question/useQuestionById";
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
            <QuestionForm
              key={question!.id}
              initial={initialForm}
              errors={errors}
              submitLabel="Perbarui"
              isPending={isPending}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default QuestionsEdit;