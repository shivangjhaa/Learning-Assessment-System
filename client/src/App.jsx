import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import DocumentsList from "./pages/documents/DocumentsList";
import DocumentDetail from "./pages/documents/DocumentDetail";
import UploadDocument from "./pages/documents/UploadDocument";
import UploadVersion from "./pages/documents/UploadVersion";
import EditDocument from "./pages/documents/EditDocument";
import EditVersion from "./pages/documents/EditVersion";
import QuizBuilder from "./pages/documents/QuizBuilder";
import Approvals from "./pages/documents/Approvals";

import MyDocuments from "./pages/employee/MyDocuments";
import ReadDocument from "./pages/employee/ReadDocument";
import TakeQuiz from "./pages/employee/TakeQuiz";
import MyCertificates from "./pages/employee/MyCertificates";

import Users from "./pages/admin/Users";
import Departments from "./pages/admin/Departments";

import AuditTrail from "./pages/audit/AuditTrail";

const ADMIN_ROLES = ["superadmin"];
const DOC_MANAGE_ROLES = ["deptadmin", "superadmin"];
const APPROVE_ROLES = ["approver", "superadmin"];
const DOC_VIEW_ROLES = ["deptadmin", "approver", "superadmin", "auditor"];
const AUDIT_ROLES = ["auditor", "superadmin"];
const EMPLOYEE_ROLES = ["employee"];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/documents" element={<ProtectedRoute roles={DOC_VIEW_ROLES}><DocumentsList /></ProtectedRoute>} />
          <Route path="/documents/upload" element={<ProtectedRoute roles={DOC_MANAGE_ROLES}><UploadDocument /></ProtectedRoute>} />
          <Route path="/documents/:id" element={<ProtectedRoute roles={DOC_VIEW_ROLES}><DocumentDetail /></ProtectedRoute>} />
          <Route path="/documents/:id/new-version" element={<ProtectedRoute roles={DOC_MANAGE_ROLES}><UploadVersion /></ProtectedRoute>} />
          <Route path="/documents/:id/edit" element={<ProtectedRoute roles={DOC_MANAGE_ROLES}><EditDocument /></ProtectedRoute>} />
          <Route path="/documents/:id/versions/:versionId/edit" element={<ProtectedRoute roles={DOC_MANAGE_ROLES}><EditVersion /></ProtectedRoute>} />
          <Route path="/documents/:id/quiz" element={<ProtectedRoute roles={DOC_MANAGE_ROLES}><QuizBuilder /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute roles={APPROVE_ROLES}><Approvals /></ProtectedRoute>} />

          <Route path="/my/documents" element={<ProtectedRoute roles={EMPLOYEE_ROLES}><MyDocuments /></ProtectedRoute>} />
          <Route path="/my/documents/:documentId/read" element={<ProtectedRoute roles={EMPLOYEE_ROLES}><ReadDocument /></ProtectedRoute>} />
          <Route path="/my/documents/:documentId/quiz" element={<ProtectedRoute roles={EMPLOYEE_ROLES}><TakeQuiz /></ProtectedRoute>} />
          <Route path="/my/certificates" element={<ProtectedRoute roles={EMPLOYEE_ROLES}><MyCertificates /></ProtectedRoute>} />

          <Route path="/admin/users" element={<ProtectedRoute roles={ADMIN_ROLES}><Users /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute roles={ADMIN_ROLES}><Departments /></ProtectedRoute>} />

          <Route path="/audit" element={<ProtectedRoute roles={AUDIT_ROLES}><AuditTrail /></ProtectedRoute>} />

          <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
