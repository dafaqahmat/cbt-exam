import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.tsx';
import { Routes, Route, Navigate } from "react-router";
import { useAuthUser } from '../hooks/auth/useAuthUser';

import Login from "../views/auth/login.tsx";
import Dashboard from "../views/admin/dashboard/index.tsx";
import UsersIndex from "../views/admin/users/index.tsx";
import UsersCreate from "../views/admin/users/create.tsx";
import UsersEdit from "../views/admin/users/edit.tsx";
import CategoriesIndex from "../views/admin/categories/index.tsx";
import ExamsIndex from "../views/admin/exams/index.tsx";
import ExamsCreate from "../views/admin/exams/create.tsx";
import ExamsEdit from "../views/admin/exams/edit.tsx";
import SectionsIndex from "../views/admin/sections/index.tsx";
import QuestionsIndex from "../views/admin/questions/index.tsx";
import QuestionsCreate from "../views/admin/questions/create.tsx";
import QuestionsEdit from "../views/admin/questions/edit.tsx";
import ResultsIndex from "../views/admin/results/index.tsx";
import ReportIndex from "../views/admin/reports/index.tsx";
import AdminProfile from "../views/admin/profile/index.tsx";
import PesertaExams from "../views/peserta/exams/index.tsx";
import ExamTake from "../views/peserta/exam/take.tsx";
import ExamResult from "../views/peserta/exam/result.tsx";

function Protected({ children, role }: { children: JSX.Element, role: string }) {
    const auth = useContext(AuthContext);
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const user = useAuthUser();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== role) {
        return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/peserta/exams'} replace />;
    }

    return children;
}

export default function AppRoutes() {

    const auth = useContext(AuthContext);
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const user = useAuthUser();

    const homeTarget = !isAuthenticated
        ? '/login'
        : user?.role === 'admin' ? '/admin/dashboard' : '/peserta/exams';

    return (
        <Routes>
            <Route path="/" element={<Navigate to={homeTarget} replace />} />

            <Route path="/login" element={
                isAuthenticated ? <Navigate to={homeTarget} replace /> : <Login />
            } />

            {/* ADMIN */}
            <Route path="/admin/dashboard" element={
                <Protected role="admin"><Dashboard /></Protected>
            } />
            <Route path="/admin/profile" element={
                <Protected role="admin"><AdminProfile /></Protected>
            } />
            <Route path="/admin/users" element={
                <Protected role="admin"><UsersIndex /></Protected>
            } />
            <Route path="/admin/users/create" element={
                <Protected role="admin"><UsersCreate /></Protected>
            } />
            <Route path="/admin/users/edit/:id" element={
                <Protected role="admin"><UsersEdit /></Protected>
            } />
            <Route path="/admin/categories" element={
                <Protected role="admin"><CategoriesIndex /></Protected>
            } />
            <Route path="/admin/exams" element={
                <Protected role="admin"><ExamsIndex /></Protected>
            } />
            <Route path="/admin/exams/create" element={
                <Protected role="admin"><ExamsCreate /></Protected>
            } />
            <Route path="/admin/exams/edit/:id" element={
                <Protected role="admin"><ExamsEdit /></Protected>
            } />
            <Route path="/admin/exams/:id/sections" element={
                <Protected role="admin"><SectionsIndex /></Protected>
            } />
            <Route path="/admin/sections/:id/questions" element={
                <Protected role="admin"><QuestionsIndex /></Protected>
            } />
            <Route path="/admin/sections/:id/questions/create" element={
                <Protected role="admin"><QuestionsCreate /></Protected>
            } />
            <Route path="/admin/questions/:id/edit" element={
                <Protected role="admin"><QuestionsEdit /></Protected>
            } />
            <Route path="/admin/exams/:id/results" element={
                <Protected role="admin"><ResultsIndex /></Protected>
            } />

            <Route path="/admin/reports" element={
                <Protected role="admin"><ReportIndex /></Protected>
            } />

            {/* PESERTA */}
            <Route path="/peserta/exams" element={
                <Protected role="peserta"><PesertaExams /></Protected>
            } />
            <Route path="/peserta/exams/:id/take" element={
                <Protected role="peserta"><ExamTake /></Protected>
            } />
            <Route path="/peserta/exams/:id/result" element={
                <Protected role="peserta"><ExamResult /></Protected>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
