import { FC, useState } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionCreate, QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const initialForm: QuestionRequest = {
  question_text: '',
  question_image: '',
  option_a_text: '',
  option_a_image: '',
  option_b_text: '',
  option_b_image: '',
  option_c_text: '',
  option_c_image: '',
  option_d_text: '',
  option_d_image: '',
  correct_answer: 'A',
  points: 1,
};

const QuestionsCreate: FC = () => {
  const { id } = useParams();
  const sectionId = Number(id);
  const navigate = useNavigate();

  const { mutate, isPending } = useQuestionCreate();
  const { data: exams } = useAdminExams();
  const exam = exams?.find((e) => (e.sections ?? []).some((s) => s.id === sectionId));
  const isActive = exam?.status === 'active';
  const isClosed = exam?.status === 'closed';
  const isLocked = isActive || isClosed;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (data: QuestionRequest) => {
    mutate({ sectionId, data }, {
      onSuccess: () => {
        toast.success("Soal berhasil dibuat");
        navigate(`/admin/sections/${sectionId}/questions`);
      },
      onError: (error) => {
        setErrors(getValidationErrors(error));
      }
    });
  };

  return (
    <AdminLayout
      title="Tambah Soal"
      description="Buat soal baru untuk sesi ini."
      actions={
        <Link to={`/admin/sections/${sectionId}/questions`}>
          <Button variant="outline"><ArrowLeft className="size-4" /> Kembali</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isActive && (
            <p className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Ujian sedang aktif, soal tidak dapat ditambah. Nonaktifkan dulu lewat <strong>"Ubah ke Draft"</strong> pada daftar soal.
            </p>
          )}
          {isClosed && (
            <p className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Ujian telah ditutup (Closed), soal tidak dapat ditambah.
            </p>
          )}
          <QuestionForm
            initial={initialForm}
            errors={errors}
            submitLabel="Simpan"
            isPending={isPending}
            disabled={isLocked}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default QuestionsCreate;