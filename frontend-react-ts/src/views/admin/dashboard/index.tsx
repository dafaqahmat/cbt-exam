import { FC } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { useAuthUser } from "../../../hooks/auth/useAuthUser";
import { useUsers } from "../../../hooks/user/useUsers";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";

const Dashboard: FC = () => {
    const user = useAuthUser();
    const { data: users } = useUsers();
    const { data: exams } = useAdminExams();

    const pesertaCount = users?.filter((u) => u.role === 'peserta').length ?? 0;
    const activeExamCount = exams?.filter((e) => e.status === 'active').length ?? 0;

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-body">
                            <h4 className="fw-bold">DASHBOARD</h4>
                            <hr />
                            <p>Selamat datang, <strong>{user?.name}</strong>!</p>
                            <div className="row mt-4">
                                <div className="col-md-4">
                                    <div className="card border-0 bg-primary text-white rounded-4 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="fw-bold">PESERTA</h6>
                                            <h3>{pesertaCount}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 bg-success text-white rounded-4 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="fw-bold">UJIAN AKTIF</h6>
                                            <h3>{activeExamCount}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 bg-warning text-white rounded-4 shadow-sm">
                                        <div className="card-body">
                                            <h6 className="fw-bold">TOTAL UJIAN</h6>
                                            <h3>{exams?.length ?? 0}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
