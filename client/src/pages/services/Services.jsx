import "./services.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { Link } from "react-router-dom";

const TEACHER_FEATURES = [
    {
        icon: "fa-solid fa-check-to-slot",
        title: "Create and manage multiple classes",
    },
    {
        icon: "fa-solid fa-user-tie",
        title: "Create and manage teachers",
    },
    {
        icon: "fa-solid fa-comment-dots",
        title: "Collect and review student feedbacks",
    },
    {
        icon: "fa-solid fa-chart-simple",
        title: "Checking attendence and participation",
    },
    {
        icon: "fa-solid fa-arrow-trend-up",
        title: "Tracking teacher performance",
    },
    {
        icon: "fa-solid fa-clock-rotate-left",
        title: "Reduce administrative workload",
    },
];

const STUDENT_FEATURES = [
    {
        icon: "fa-solid fa-thumbs-up",
        title: "Simple, student-friendly interface",
    },
    {
        icon: "fa-solid fa-star-half-stroke",
        title: "Quick feedback submission with ratings",
    },
    {
        icon: "fa-solid fa-user-ninja",
        title: "Anonymous and honest feedback options",
    },
    {
        icon: "fa-solid fa-arrow-trend-up",
        title: "Help teachers improve your classes",
    },
];

export default function ServicesPage() {
    return (
        <div className="sp-page">
            {/* HERO */}
            <section className="sp-hero">
                <div className="sp-container">
                    <div className="sp-hero-inner">
                        <p className="sp-kicker">For Teachers</p>

                        <h1 className="sp-hero-title">
                            Manage Your Classes with <br />
                            Confidence
                        </h1>

                        <p className="sp-hero-desc">
                            EDUZO helps teachers manage classes efficiently
                            while giving students a simple, friendly way to
                            share feedback and stay connected with their
                            learning journey.
                        </p>

                        <div className="sp-hero-actions">
                            <Link
                                className="sp-btn sp-btn-primary"
                                to="/auth/sign-up"
                            >
                                Start free trial
                            </Link>
                            <Link
                                className="sp-btn sp-btn-ghost"
                                to="/auth/sign-in"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TEACHER FEATURES */}
            <section className="sp-section">
                <div className="sp-container">
                    <h2 className="sp-section-title">
                        Everything You Need in One Platform
                    </h2>
                    <p className="sp-section-subtitle">
                        Built for simplicity and efficiency, EDUZO reduces
                        administrative complexity while improving communication.
                    </p>

                    <div className="sp-grid">
                        {TEACHER_FEATURES.map((f) => (
                            <div className="sp-card" key={f.title}>
                                <div
                                    className="sp-card-icon"
                                    aria-hidden="true"
                                >
                                    <i className={f.icon}></i>
                                </div>
                                <p className="sp-card-title">{f.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* dashboard mock */}
                    <div
                        className="sp-mock sp-mock-dashboard"
                        aria-label="Dashboard preview"
                    >
                        <p>để ảnh ở đây nha</p>
                    </div>
                </div>
            </section>

            {/* STUDENTS */}
            <section className="sp-section">
                <div className="sp-container">
                    <p className="sp-kicker sp-kicker-center">For Students</p>

                    <h2 className="sp-section-title">
                        Share Your Voice,{" "}
                        <span className="sp-accent">Shape Your Education</span>
                    </h2>

                    <p className="sp-section-subtitle">
                        EDUZO makes it easy and comfortable for students to
                        provide meaningful feedback that helps improve their
                        learning experience.
                    </p>

                    <div className="sp-grid-student">
                        {STUDENT_FEATURES.map((f) => (
                            <div className="sp-card" key={f.title}>
                                <div
                                    className="sp-card-icon"
                                    aria-hidden="true"
                                >
                                    <i className={f.icon}></i>
                                </div>
                                <p className="sp-card-title">{f.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* rating mocks */}
                    <div className="sp-rating-row">
                        <p>để ảnh ở đây nè</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
