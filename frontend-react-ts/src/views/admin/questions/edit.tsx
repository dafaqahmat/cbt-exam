import { FC, useState } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionUpdate } from "../../../hooks/question/useQuestionUpdate";
import { QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { useQuestionById } from "../../../hooks/question/useQuestionById";
import { getValidationErrors } from "../../../services/errors";

interface ValidationErrors {
    [key: string]: string;
}

const QuestionsEdit: FC = () => {
    const { id } = useParams();
    const questionId = Number(id);
    const navigate = useNavigate();

    const { data: question, isLoading, isError, error } = useQuestionById(questionId);
    const { mutate, isPending } = useQuestionUpdate();
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = (data: QuestionRequest) => {
        mutate({ id: questionId, data }, {
            onSuccess: () => {
                navigate(-1);
            },
            onError: (err) => {
                setErrors(getValidationErrors(err));
            }
        });
    };

    const initialForm: QuestionRequest | null = question ? {
        type: question.type,
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
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>EDIT SOAL</span>
                            <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI</button>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}
                            {initialForm && (
                                <QuestionForm
                                    key={question!.id}
                                    initial={initialForm}
                                    errors={errors}
                                    submitLabel="UPDATE"
                                    isPending={isPending}
                                    onSubmit={handleSubmit}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuestionsEdit;
