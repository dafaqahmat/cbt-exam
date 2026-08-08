import { FC, useState, FormEvent, useEffect } from "react";
import SidebarMenu from '../../../components/SidebarMenu';
import { Link, useNavigate, useParams } from "react-router";
import { useUserById } from "../../../hooks/user/useUserById";
import { useUserUpdate } from "../../../hooks/user/useUserUpdate";
import { getValidationErrors } from "../../../services/errors";

interface ValidationErrors {
    [key: string]: string;
}

const UsersEdit: FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userId = Number(id);

    const { data: user, isLoading } = useUserById(userId);
    const { mutate, isPending } = useUserUpdate();

    const [name, setName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<string>('peserta');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (user) {
            setName(user.name);
            setUsername(user.username);
            setEmail(user.email);
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        mutate({ id: userId, data: { name, username, email, password, role } }, {
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
                            <span>EDIT USER</span>
                        </div>
                        <div className="card-body">
                            {isLoading && <div className="alert alert-info text-center">Loading...</div>}
                            {!isLoading && (
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
                                        <label className="mb-1 fw-bold">Password (kosongkan jika tidak diubah)</label>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="Password baru" />
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
                                        {isPending ? 'Loading...' : 'UPDATE'}
                                    </button>
                                    <Link to="/admin/users" className="btn btn-secondary rounded-4 shadow-sm border-0">BATAL</Link>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UsersEdit;
