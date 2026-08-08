import { FC, useState, FormEvent } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useNavigate } from "react-router";
import { useExamCreate } from "../../../hooks/exam/useExamCreate";
import { getValidationErrors } from "../../../services/errors";

interface ValidationErrors {
    [key: string]: string;
}

const ExamsCreate: FC = () => {
    const navigate = useNavigate();
    const { mutate, isPending } = useExamCreate();

    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [status, setStatus] = useState<string>('draft');
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        mutate({ title, description, status }, {
            onSuccess: () => {
                navigate('/admin/exams');
            },
            onError: (error) => {
                setErrors(getValidationErrors(error));
            }
        })
    }

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header">
                            <span>TAMBAH UJIAN</span>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Judul</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-control" placeholder="Judul ujian" />
                                    {errors.Title && <div className="alert alert-danger mt-2 rounded-4">{errors.Title}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Deskripsi</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control" rows={3} placeholder="Deskripsi ujian"></textarea>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Status</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary rounded-4 shadow-sm border-0 me-2" disabled={isPending}>
                                    {isPending ? 'Loading...' : 'SIMPAN'}
                                </button>
                                <Link to="/admin/exams" className="btn btn-secondary rounded-4 shadow-sm border-0">BATAL</Link>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamsCreate;
