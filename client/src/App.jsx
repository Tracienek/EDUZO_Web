// src/App.jsx
import { useEffect } from "react";
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";
// import AOS from "aos";
// import "aos/dist/aos.css";

import AuthLayout from "./pages/auth/AuthLayout.jsx";
import SignIn from "./pages/auth/SignIn.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import Verification from "./pages/auth/Verification.jsx";
// import Layout from "./components/layout/Layout.jsx";
import LandingPage from "./pages/landing/LandingPage.jsx";
// import About from "./pages/landing/About.jsx";
import Services from "./pages/services/Services.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import WorkspaceLayout from "./pages/workspace/WorkspaceLayout.jsx";
import ClassesPage from "./pages/workspace/classes/ClassesPage.jsx";
import ClassDetailPage from "./pages/workspace/classes/classDetail/ClassDetailPage.jsx";
import FullAttendancePage from "./pages/workspace/classes/classDetail/attendance/FullAttendancePage.jsx";
import TeachersPanel from "./pages/workspace/teachers/TeacherPage.jsx";
import ProfilePage from "./pages/workspace/profile/ProfilePage.jsx";
import TeacherDetail from "./pages/workspace/teachers/teacherDetail/TeacherDetail.jsx";
import NotificationsPage from "./pages/workspace/noti/Notification.jsx";
import FeedbackPage from "./pages/workspace/classes/classDetail/FeedbackPanel/FeedbackPage.jsx";
import NoteDetails from "./pages/workspace/classes/classDetail/NotesPanel/noteDetails/NoteDetails.jsx";
import FullFeedback from "./pages/workspace/teachers/teacherDetail/fullFeedback/FullFeedback.jsx";
import FullClassFeedback from "./pages/workspace/classes/classDetail/FeedbackPanel/fullFeedback/FullClassFeedback.jsx";
import StudentProfilePage from "./pages/workspace/classes/classDetail/StudentSection/students/StudentProfilePage.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <PublicLayout />,
        children: [
            { index: true, element: <LandingPage /> },
            { path: "services", element: <Services /> },
        ],
    },
    {
        path: "/auth",
        element: <AuthLayout />,
        children: [
            { path: "signIn", element: <SignIn /> },
            { path: "signup", element: <SignUp /> },
            { path: "verification", element: <Verification /> },
        ],
    },
    { path: "/feedback/:classId", element: <FeedbackPage /> },
    {
        path: "/workspace",
        element: <WorkspaceLayout />,
        children: [
            { index: true, element: <Navigate to="classes" replace /> },

            { path: "classes", element: <ClassesPage /> },
            { path: "classes/:classId", element: <ClassDetailPage /> },
            {
                path: "classes/:classId/attendance",
                element: <FullAttendancePage />,
            },
            { path: "classes/:classId/notes", element: <NoteDetails /> },
            {
                path: "classes/:classId/feedbacks",
                element: <FullClassFeedback />,
            },
            {
                path: "students/:studentId",
                element: <StudentProfilePage />,
            },

            {
                path: "teachers",
                children: [
                    { index: true, element: <TeachersPanel /> },
                    { path: ":teacherId/feedbacks", element: <FullFeedback /> },
                    { path: ":teacherId", element: <TeacherDetail /> },
                ],
            },

            { path: "profile", element: <ProfilePage /> },
            { path: "notifications", element: <NotificationsPage /> },
        ],
    },
]);

export default function App() {
    // useEffect(() => {
    //     AOS.init({
    //         duration: 800,
    //         offset: 100,
    //         easing: "ease-out-cubic",
    //         once: false,
    //     });
    // }, []);

    return <RouterProvider router={router} />;
}
