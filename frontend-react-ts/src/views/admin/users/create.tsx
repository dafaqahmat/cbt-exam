import { FC, useState, FormEvent } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useNavigate } from "react-router";
import { useUserCreate } from "../../../hooks/user/useUserCreate";
import { getValidationErrors } from "../../../services/errors";

interface ValidationErrors {
    [key: string]: string;
}

const UsersCreate: FC = () => {
    const navigate = useNavigate();
    const { mutate, isPending } = useUserCreate();

    const [name, setName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<string>('peserta');
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        mutate({ name, username, email, password, role }, {
            onSuccess: () => {
                navigate('/admin/users');
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
                            <span>TAMBAH USER</span>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Nama</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" placeholder="Nama lengkap" />
                                    {errors.Name && <div className="alert alert-danger mt-2 rounded-4">{errors.Name}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Username</label>
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" placeholder="Username" />
                                    {errors.Username && <div className="alert alert-danger mt-2 rounded-4">{errors.Username}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="Email" />
                                    {errors.Email && <div className="alert alert-danger mt-2 rounded-4">{errors.Email}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Password (min. 6 karakter)</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="Password" />
                                    {errors.Password && <div className="alert alert-danger mt-2 rounded-4">{errors.Password}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="mb-1 fw-bold">Role</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                                        <option value="peserta">Peserta</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {errors.Role && <div className="alert alert-danger mt-2 rounded-4">{errors.Role}</div>}
                                </div>
                                <button type="submit" className="btn btn-primary rounded-4 shadow-sm border-0 me-2" disabled={isPending}>
                                    {isPending ? 'Loading...' : 'SIMPAN'}
                                </button>
                                <Link to="/admin/users" className="btn btn-secondary rounded-4 shadow-sm border-0">BATAL</Link>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UsersCreate;
