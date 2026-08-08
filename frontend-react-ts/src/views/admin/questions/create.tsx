import { FC, useState } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionCreate, QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { getValidationErrors } from "../../../services/errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const initialForm: QuestionRequest = {
  type: 'text_text',
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
          <QuestionForm
            initial={initialForm}
            errors={errors}
            submitLabel="Simpan"
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default QuestionsCreate;