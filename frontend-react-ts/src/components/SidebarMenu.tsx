import { FC } from 'react';
import { Link, useLocation } from "react-router";

const SidebarMenu: FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path) ? 'active' : '';

    return (
        <div className="card border-0 rounded-4 shadow-sm">
            <div className="card-header">
                MENU ADMIN
            </div>
            <div className="card-body">
                <div className="list-group">
                    <Link to="/admin/dashboard" className={`list-group-item list-group-item-action ${isActive('/admin/dashboard')}`}>Dashboard</Link>
                    <Link to="/admin/users" className={`list-group-item list-group-item-action ${isActive('/admin/users')}`}>Kelola Peserta</Link>
                    <Link to="/admin/exams" className={`list-group-item list-group-item-action ${isActive('/admin/exams')}`}>Kelola Ujian</Link>
                </div>
            </div>
        </div>
    )
}

export default SidebarMenu;
