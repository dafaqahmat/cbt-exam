import { FC, useState, FormEvent } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useParams } from "react-router";
import { useSections, Section } from "../../../hooks/section/useSections";
import { useSectionCreate, SectionRequest } from "../../../hooks/section/useSectionCreate";
import { useSectionUpdate } from "../../../hooks/section/useSectionUpdate";
import { useSectionDelete } from "../../../hooks/section/useSectionDelete";
import { useQueryClient } from '@tanstack/react-query';
import { getValidationErrors } from '../../../services/errors';

interface ValidationErrors {
    [key: string]: string;
}

const emptyForm: SectionRequest = {
    title: '',
    order: 1,
    duration_minutes: 30,
    break_after_seconds: 0,
};

const SectionsIndex: FC = () => {
    const { id } = useParams();
    const examId = Number(id);

    const { data: sections, isLoading, isError, error } = useSections(examId);
    const queryClient = useQueryClient();

    const { mutate: createSection, isPending: creating } = useSectionCreate();
    const { mutate: updateSection, isPending: updating } = useSectionUpdate();
    const { mutate: deleteSection } = useSectionDelete();

    const [form, setForm] = useState<SectionRequest>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['sections', examId] });
        queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    };

    const handleChange = (field: keyof SectionRequest, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const onSuccess = () => {
            setForm(emptyForm);
            setEditingId(null);
            setErrors({});
            invalidate();
        };
        const onError = (err: unknown) => {
            setErrors(getValidationErrors(err));
        };

        if (editingId !== null) {
            updateSection({ id: editingId, data: form }, { onSuccess, onError });
        } else {
            createSection({ examId, data: form }, { onSuccess, onError });
        }
    };

    const handleEdit = (section: Section) => {
        setEditingId(section.id);
        setForm({
            title: section.title,
            order: section.order,
            duration_minutes: section.duration_minutes,
            break_after_seconds: section.break_after_seconds,
        });
        setErrors({});
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
    };

    const handleDelete = (id: number) => {
        if (confirm("Yakin ingin menghapus sesi ini? Semua soal di dalamnya ikut terhapus.")) {
            deleteSection(id, { onSuccess: invalidate });
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-3">
                    <SidebarMenu />
                </div>
                <div className="col-md-9">
                    <div className="card border-0 rounded-4 shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>{editingId !== null ? 'EDIT SESI' : 'TAMBAH SESI'}</span>
                            <Link to="/admin/exams" className="btn btn-sm btn-secondary rounded-4 shadow-sm border-0">KEMBALI KE UJIAN</Link>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="mb-1 fw-bold">Judul Sesi</label>
                                            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="form-control" placeholder="Contoh: Sesi 1 - Penalaran" />
                                            {errors.Title && <div className="alert alert-danger mt-2 rounded-4">{errors.Title}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="mb-1 fw-bold">Urutan</label>
                                            <input type="number" min={1} value={form.order} onChange={(e) => handleChange('order', Number(e.target.value))} className="form-control" />
                                            {errors.Order && <div className="alert alert-danger mt-2 rounded-4">{errors.Order}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="mb-1 fw-bold">Durasi (menit)</label>
                                            <input type="number" min={1} value={form.duration_minutes} onChange={(e) => handleChange('duration_minutes', Number(e.target.value))} className="form-control" />
                                            {errors.DurationMinutes && <div className="alert alert-danger mt-2 rounded-4">{errors.DurationMinutes}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="mb-1 fw-bold">Istirahat Setelahnya (detik, 0 = tanpa istirahat)</label>
                                            <input type="number" min={0} value={form.break_after_seconds} onChange={(e) => handleChange('break_after_seconds', Number(e.target.value))} className="form-control" />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary rounded-4 shadow-sm border-0 me-2" disabled={creating || updating}>
                                    {(creating || updating) ? 'Loading...' : (editingId !== null ? 'UPDATE' : 'SIMPAN')}
                                </button>
                                {editingId !== null && (
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary rounded-4 shadow-sm border-0">BATAL</button>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="card border-0 rounded-4 shadow-sm">
                        <div className="card-header">
                            <span>DAFTAR SESI</span>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {isError && <div className="alert alert-danger text-center">Error: {error.message}</div>}

                            <table className="table table-bordered">
                                <thead className="bg-dark text-white">
                                    <tr>
                                        <th scope="col">Urutan</th>
                                        <th scope="col">Judul</th>
                                        <th scope="col">Durasi</th>
                                        <th scope="col">Istirahat</th>
                                        <th scope="col">Soal</th>
                                        <th scope="col" style={{ width: "30%" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections?.map((section: Section) => (
                                        <tr key={section.id}>
                                            <td className="text-center">{section.order}</td>
                                            <td>{section.title}</td>
                                            <td className="text-center">{section.duration_minutes} menit</td>
                                            <td className="text-center">{section.break_after_seconds > 0 ? `${section.break_after_seconds} detik` : '-'}</td>
                                            <td className="text-center">{section.question_count}</td>
                                            <td className="text-center">
                                                <Link to={`/admin/sections/${section.id}/questions`} className="btn btn-sm btn-warning rounded-4 shadow-sm border-0 me-1">SOAL</Link>
                                                <button onClick={() => handleEdit(section)} className="btn btn-sm btn-primary rounded-4 shadow-sm border-0 me-1">EDIT</button>
                                                <button onClick={() => handleDelete(section.id)} className="btn btn-sm btn-danger rounded-4 shadow-sm border-0">HAPUS</button>
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

export default SectionsIndex;
