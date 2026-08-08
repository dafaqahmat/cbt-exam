import { FC } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link } from "react-router";
import { useAdminExams, Exam } from "../../../hooks/exam/useAdminExams";
import { useExamDelete } from "../../../hooks/exam/useExamDelete";
import { useQueryClient } from '@tanstack/react-query';

const statusBadge = (status: string) => {
    switch (status) {
        case 'active': return 'bg-success';
        case 'closed': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

const ExamsIndex: FC = () => {
    const { data: exams, isLoading, isError, error } = useAdminExams();

    const queryClient = useQueryClient();
    const { mutate, isPending } = useExamDelete();

    const handleDelete = (id: number) => {
        if (confirm("Yakin ingin menghapus ujian ini? Semua sesi & soal terkait ikut terhapus.")) {
            mutate(id, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
                }
            });
        }
    }

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>KELOLA UJIAN</span>
                            <Link to="/admin/exams/create" className="btn btn-sm btn-success rounded-4 shadow-sm border-0">TAMBAH UJIAN</Link>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            <table className="table table-bordered">
                                <thead className="bg-dark text-white">
                                    <tr>
                                        <th scope="col">Judul</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Sesi</th>
                                        <th scope="col">Soal</th>
                                        <th scope="col">Peserta</th>
                                        <th scope="col">Hasil</th>
                                        <th scope="col" style={{ width: "35%" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams?.map((exam: Exam) => (
                                        <tr key={exam.id}>
                                            <td>{exam.title}</td>
                                            <td><span className={`badge ${statusBadge(exam.status)}`}>{exam.status}</span></td>
                                            <td className="text-center">{exam.section_count}</td>
                                            <td className="text-center">{exam.question_count}</td>
                                            <td className="text-center">{exam.participant_count}</td>
                                            <td className="text-center">
                                                <span className={`badge ${exam.results_published ? 'bg-info' : 'bg-secondary'}`}>
                                                    {exam.results_published ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <Link to={`/admin/exams/${exam.id}/sections`} className="btn btn-sm btn-warning rounded-4 shadow-sm border-0 me-1">SESI</Link>
                                                <Link to={`/admin/exams/${exam.id}/results`} className="btn btn-sm btn-info rounded-4 shadow-sm border-0 me-1">HASIL</Link>
                                                <Link to={`/admin/exams/edit/${exam.id}`} className="btn btn-sm btn-primary rounded-4 shadow-sm border-0 me-1">EDIT</Link>
                                                <button onClick={() => handleDelete(exam.id)} disabled={isPending} className="btn btn-sm btn-danger rounded-4 shadow-sm border-0">
                                                    {isPending ? '...' : 'HAPUS'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamsIndex;
