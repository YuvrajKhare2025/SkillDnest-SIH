import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";

import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerDashboard from "./pages/CustomerDashboard";

import CooperativeLogin from "./pages/CooperativeLogin";
import CooperativeRegister from "./pages/CooperativeRegister";
import CooperativeDashboard from "./pages/CooperativeDashboard";

import AddWorker from "./pages/AddWorker";
import WorkerManagement from "./pages/WorkerManagement";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerDashboard from "./pages/WorkerDashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    WELCOME
                ========================= */}
                <Route
                    path="/"
                    element={<Welcome />}
                />

                {/* =========================
                    MAIN LOGIN
                ========================= */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* =========================
                    CUSTOMER
                ========================= */}
                <Route
                    path="/customer-login"
                    element={<CustomerLogin />}
                />

                <Route
                    path="/customer-register"
                    element={<CustomerRegister />}
                />

                <Route
                    path="/customer-dashboard"
                    element={<CustomerDashboard />}
                />

                {/* =========================
                    COOPERATIVE
                ========================= */}
                <Route
                    path="/cooperative-login"
                    element={<CooperativeLogin />}
                />

                <Route
                    path="/cooperative-register"
                    element={<CooperativeRegister />}
                />

                <Route
                    path="/cooperative-dashboard"
                    element={<CooperativeDashboard />}
                />

                {/* =========================
                    WORKER
                ========================= */}
                <Route
                    path="/add-worker"
                    element={<AddWorker />}
                />

                <Route
                    path="/worker-management"
                    element={<WorkerManagement />}
                />

                <Route
                    path="/worker-login"
                    element={<WorkerLogin />}
                />

                <Route
                    path="/worker-dashboard"
                    element={<WorkerDashboard />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;