import { FC } from "react";
import { Link, useParams } from "react-router";
import { usePesertaResult } from "../../../hooks/peserta/usePesertaResult";
import { SectionScore } from "../../../hooks/result/useAdminResults";

const ExamResult: FC = () => {
    const { id } = useParams();
    const examId = Number(id);

    const { data, isLoading, isError, error } = usePesertaResult(examId);

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>HASIL UJIAN</span>
                            <Link to="/peserta/exams" className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI</Link>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            {data && !data.published && (
                                <div className="alert alert-warning text-center">
                                    <h5 className="fw-bold">Nilai Belum Diumumkan</h5>
                                    <p className="mb-0">Anda telah menyelesaikan ujian. Nilai akan ditampilkan setelah admin mempublikasikannya. Cek kembali halaman ini nanti.</p>
                                </div>
                            )}

                            {data && data.published && (
                                <>
                                    <div className="text-center mb-4">
                                        <h6 className="text-muted">Nilai Total Anda</h6>
                                        <h1 className="display-3 fw-bold text-primary">{data.total_score ?? 0}</h1>
                                    </div>

                                    <div className="alert alert-info">
                                        Jumlah pelanggaran selama ujian: <strong>{data.violation_count ?? 0}</strong>
                                    </div>

                                    <h6 className="fw-bold mt-4">Nilai Per Sesi</h6>
                                    <table className="table table-bordered">
                                        <thead className="bg-dark text-white">
                                            <tr>
                                                <th scope="col">No</th>
                                                <th scope="col">Sesi</th>
                                                <th scope="col">Nilai</th>
                                                <th scope="col">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.sections?.map((s: SectionScore) => (
                                                <tr key={s.section_id}>
                                                    <td className="text-center">{s.order}</td>
                                                    <td>{s.title}</td>
                                                    <td className="text-center fw-bold">{s.score ?? '-'}</td>
                                                    <td>
                                                        <span className={`badge ${s.status === 'finished' ? 'bg-success' : 'bg-warning'}`}>
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamResult;
