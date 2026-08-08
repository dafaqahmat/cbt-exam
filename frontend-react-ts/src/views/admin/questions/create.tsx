import { FC, useState } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useNavigate, useParams } from "react-router";
import QuestionForm from "../../../components/QuestionForm";
import { useQuestionCreate, QuestionRequest } from "../../../hooks/question/useQuestionCreate";
import { getValidationErrors } from "../../../services/errors";

interface ValidationErrors {
    [key: string]: string;
}

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
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = (data: QuestionRequest) => {
        mutate({ sectionId, data }, {
            onSuccess: () => {
                navigate(`/admin/sections/${sectionId}/questions`);
            },
            onError: (error) => {
                setErrors(getValidationErrors(error));
            }
        });
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>TAMBAH SOAL</span>
                            <Link to={`/admin/sections/${sectionId}/questions`} className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI</Link>
                        </div>
                        <div className="card-body">
                            <QuestionForm
                                initial={initialForm}
                                errors={errors}
                                submitLabel="SIMPAN"
                                isPending={isPending}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuestionsCreate;
