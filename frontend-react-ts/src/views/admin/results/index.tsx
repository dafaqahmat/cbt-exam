import { FC, useState } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useParams } from "react-router";
import { useAdminResults, AdminResultItem } from "../../../hooks/result/useAdminResults";
import { useSessionAnswers, AnswerReviewItem } from "../../../hooks/result/useSessionAnswers";
import { useExamPublish } from "../../../hooks/exam/useExamPublish";
import { useQueryClient } from '@tanstack/react-query';
import { imageUrl } from "../../../services/api";

const AnswersModal: FC<{ sessionId: number, onClose: () => void }> = ({ sessionId, onClose }) => {
    const { data, isLoading, isError, error } = useSessionAnswers(sessionId, true);

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Detail Jawaban (Nilai: {data?.total_score ?? '-'})</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                        {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}
                        {data?.answers.map((answer: AnswerReviewItem, index: number) => (
                            <div key={answer.question_id} className={`border rounded p-3 mb-2 ${answer.is_correct ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                                <div className="d-flex justify-content-between">
                                    <strong>#{index + 1}</strong>
                                    <span>
                                        Jawaban: <strong>{answer.selected_option || '-'}</strong> |
                                        Kunci: <strong>{answer.correct_answer}</strong> |
                                        {answer.is_correct ? ' BENAR' : ' SALAH'}
                                    </span>
                                </div>
                                {answer.question_text && <p className="mb-1 mt-2">{answer.question_text}</p>}
                                {answer.question_image && <img src={imageUrl(answer.question_image)} alt="soal" className="img-thumbnail mb-2" style={{ maxWidth: '150px' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultsIndex: FC = () => {
    const { id } = useParams();
    const examId = Number(id);

    const { data, isLoading, isError, error } = useAdminResults(examId);
    const queryClient = useQueryClient();
    const { mutate: publish, isPending: publishing } = useExamPublish();
    const [selectedSession, setSelectedSession] = useState<number | null>(null);

    const handlePublish = () => {
        if (confirm("Publikasikan hasil ujian ini? Peserta akan bisa melihat nilainya.")) {
            publish(examId, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['admin-results', examId] });
                    queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
                }
            });
        }
    };

    const exam = data?.exam;
    const results = data?.results ?? [];

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>HASIL UJIAN{exam ? `: ${exam.title}` : ''}</span>
                            <div>
                                {!exam?.results_published && (
                                    <button onClick={handlePublish} disabled={publishing} className="btn btn-sm btn-info rounded-4 shadow-sm border-0 me-2">
                                        {publishing ? 'Loading...' : 'PUBLISH HASIL'}
                                    </button>
                                )}
                                <Link to="/admin/exams" className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI</Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            {exam?.results_published && (
                                <div className="alert alert-success">Hasil ujian ini sudah dipublikasikan. Peserta dapat melihat nilainya.</div>
                            )}

                            <table className="table table-bordered">
                                <thead className="bg-dark text-white">
                                    <tr>
                                        <th scope="col">Peserta</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Nilai Total</th>
                                        <th scope="col">Pelanggaran</th>
                                        <th scope="col">Nilai Per Sesi</th>
                                        <th scope="col" style={{ width: "15%" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result: AdminResultItem) => (
                                        <tr key={result.session_id}>
                                            <td>{result.user.name}<br /><small className="text-muted">{result.user.username}</small></td>
                                            <td>
                                                <span className={`badge ${result.status === 'finished' ? 'bg-success' : 'bg-warning'}`}>
                                                    {result.status}
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold">{result.total_score ?? '-'}</td>
                                            <td className="text-center">
                                                <span className={`badge ${result.violation_count > 0 ? 'bg-danger' : 'bg-secondary'}`}>
                                                    {result.violation_count}
                                                </span>
                                            </td>
                                            <td>
                                                {result.sections.map((s) => (
                                                    <div key={s.section_id}>
                                                        <small>{s.order}. {s.title}: <strong>{s.score ?? '-'}</strong></small>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="text-center">
                                                <button onClick={() => setSelectedSession(result.session_id)} className="btn btn-sm btn-primary rounded-4 shadow-sm border-0">
                                                    JAWABAN
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {results.length === 0 && !isLoading && (
                                <div className="alert alert-warning text-center">Belum ada peserta yang mengerjakan ujian ini.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedSession !== null && (
                <AnswersModal sessionId={selectedSession} onClose={() => setSelectedSession(null)} />
            )}
        </div>
    )
}

export default ResultsIndex;
