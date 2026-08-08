import { FC } from "react";
import { Link, useNavigate } from "react-router";
import { usePesertaExams, PesertaExam } from "../../../hooks/peserta/usePesertaExams";
import { useAuthUser } from "../../../hooks/auth/useAuthUser";

const PesertaExams: FC = () => {
    const { data: exams, isLoading, isError, error } = usePesertaExams();
    const user = useAuthUser();
    const navigate = useNavigate();

    const getStatusBadge = (exam: PesertaExam) => {
        if (!exam.session) {
            return <span className="badge bg-secondary">Belum dikerjakan</span>;
        }
        if (exam.session.status === 'in_progress') {
            return <span className="badge bg-warning text-dark">Sedang berjalan</span>;
        }
        if (exam.results_published) {
            return <span className="badge bg-info">Nilai tersedia</span>;
        }
        return <span className="badge bg-success">Selesai (menunggu nilai)</span>;
    };

    const handleAction = (exam: PesertaExam) => {
        if (!exam.session) {
            if (confirm(`Mulai ujian "${exam.title}"? Setelah dimulai, ujian tidak bisa diulang.`)) {
                navigate(`/peserta/exams/${exam.id}/take`);
            }
        } else if (exam.session.status === 'in_progress') {
            navigate(`/peserta/exams/${exam.id}/take`);
        } else {
            navigate(`/peserta/exams/${exam.id}/result`);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>DAFTAR UJIAN</span>
                            <span className="text-muted small">Peserta: {user?.name}</span>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            {exams?.map((exam: PesertaExam) => (
                                <div key={exam.id} className="border rounded p-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="fw-bold mb-1">{exam.title}</h5>
                                            <p className="text-muted mb-2">{exam.description}</p>
                                            <div className="mb-2">
                                                <span className="badge bg-dark me-2">{exam.section_count} sesi</span>
                                                <span className="badge bg-primary">{exam.total_duration_minutes} menit</span>
                                            </div>
                                            {getStatusBadge(exam)}
                                            {exam.session && exam.results_published && exam.session.total_score !== null && (
                                                <span className="badge bg-warning text-dark ms-2">Nilai: {exam.session.total_score}</span>
                                            )}
                                        </div>
                                        <button onClick={() => handleAction(exam)} className="btn btn-primary rounded-4 shadow-sm border-0">
                                            {!exam.session ? 'MULAI' : exam.session.status === 'in_progress' ? 'LANJUTKAN' : 'LIHAT HASIL'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {exams?.length === 0 && !isLoading && (
                                <div className="alert alert-warning text-center">Belum ada ujian yang tersedia.</div>
                            )}

                            <div className="text-center mt-3">
                                <Link to="/login" className="text-muted small">Refresh halaman untuk melihat ujian baru</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PesertaExams;
