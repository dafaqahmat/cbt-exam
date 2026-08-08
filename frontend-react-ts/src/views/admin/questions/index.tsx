import { FC } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useParams } from "react-router";
import { useAdminQuestions, Question } from "../../../hooks/question/useAdminQuestions";
import { useQuestionDelete } from "../../../hooks/question/useQuestionDelete";
import { useQueryClient } from '@tanstack/react-query';
import { imageUrl } from "../../../services/api";

const QuestionsIndex: FC = () => {
    const { id } = useParams();
    const sectionId = Number(id);

    const { data: questions, isLoading, isError, error } = useAdminQuestions(sectionId);
    const queryClient = useQueryClient();
    const { mutate, isPending } = useQuestionDelete();

    const handleDelete = (questionId: number) => {
        if (confirm("Yakin ingin menghapus soal ini?")) {
            mutate(questionId, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['admin-questions', sectionId] });
                }
            });
        }
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
                            <span>KELOLA SOAL</span>
                            <div>
                                <Link to={`/admin/sections/${sectionId}/questions/create`} className="btn btn-sm btn-success rounded-4 shadow-sm border-0 me-2">TAMBAH SOAL</Link>
                                <Link to="/admin/exams" className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI</Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            {questions?.map((question: Question, index: number) => (
                                <div key={question.id} className="border rounded p-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="badge bg-dark me-2">#{index + 1}</span>
                                            <span className="badge bg-secondary me-2">{question.type}</span>
                                            <span className="badge bg-info">Kunci: {question.correct_answer}</span>
                                            <span className="badge bg-warning text-dark ms-2">{question.points} poin</span>
                                        </div>
                                        <div>
                                            <Link to={`/admin/questions/${question.id}/edit`} className="btn btn-sm btn-primary rounded-4 shadow-sm border-0 me-1">EDIT</Link>
                                            <button onClick={() => handleDelete(question.id)} disabled={isPending} className="btn btn-sm btn-danger rounded-4 shadow-sm border-0">
                                                {isPending ? '...' : 'HAPUS'}
                                            </button>
                                        </div>
                                    </div>
                                    <hr />
                                    {question.question_text && <p className="mb-2">{question.question_text}</p>}
                                    {question.question_image && (
                                        <img src={imageUrl(question.question_image)} alt="soal" className="img-thumbnail mb-2" style={{ maxWidth: '200px' }} />
                                    )}
                                    <div className="row">
                                        {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                                            const text = question[`option_${opt}_text` as keyof Question] as string;
                                            const img = question[`option_${opt}_image` as keyof Question] as string;
                                            return (
                                                <div key={opt} className="col-md-3">
                                                    <div className={`p-2 border rounded ${question.correct_answer === opt.toUpperCase() ? 'bg-success-subtle' : ''}`}>
                                                        <strong>{opt.toUpperCase()}.</strong>
                                                        {text && <span> {text}</span>}
                                                        {img && <img src={imageUrl(img)} alt={`opsi ${opt}`} className="img-fluid d-block mt-1" style={{ maxWidth: '80px' }} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {questions?.length === 0 && <div className="alert alert-warning text-center">Belum ada soal di sesi ini.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuestionsIndex;
