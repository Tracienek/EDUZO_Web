import "./services.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { Link } from "react-router-dom";
import img3 from "../../assets/hero/img3.jpg";
import img5 from "../../assets/hero/img5.jpg";

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
        <div className="srp-page">
            {/* HERO */}
            <section className="srp-hero">
                <div className="srp-container">
                    <div className="srp-hero-inner">
                        <p className="srp-kicker">For Teachers</p>

                        <h1 className="srp-hero-title">
                            Manage Your Classes with <br />
                            Confidence
                        </h1>

                        <p className="srp-hero-desc">
                            EDUZO helps teachers manage classes efficiently
                            while giving students a simple, friendly way to
                            share feedback and stay connected with their
                            learning journey.
                        </p>

                        <div className="srp-hero-actions">
                            <Link
                                className="srp-btn srp-btn-primary"
                                to="/auth/signIp"
                            >
                                Start free trial
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TEACHER FEATURES */}
            <section className="srp-section">
                <div className="srp-container">
                    <h2 className="srp-section-title">
                        Everything You Need in One Platform
                    </h2>
                    <p className="srp-section-subtitle">
                        Built for simplicity and efficiency, EDUZO reduces
                        administrative complexity while improving communication.
                    </p>

                    <div className="srp-grid">
                        {TEACHER_FEATURES.map((f) => (
                            <div className="srp-card" key={f.title}>
                                <div
                                    className="srp-card-icon"
                                    aria-hidden="true"
                                >
                                    <i className={f.icon}></i>
                                </div>
                                <p className="srp-card-title">{f.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* dashboard mock */}
                    <div
                        className="srp-mock srp-mock-dashboard"
                        aria-label="Dashboard preview"
                    >
                        <img
                            src={img3}
                            alt="Dashboard preview"
                            className="srp-mock-img"
                        />
                    </div>
                </div>
            </section>

            {/* STUDENTS */}
            <section className="srp-section">
                <div className="srp-container">
                    <p className="srp-kicker srp-kicker-center">For Students</p>

                    <h2 className="srp-section-title">
                        Share Your Voice,{" "}
                        <srpan className="srp-accent">
                            Shape Your Education
                        </srpan>
                    </h2>

                    <p className="srp-section-subtitle">
                        EDUZO makes it easy and comfortable for students to
                        provide meaningful feedback that helps improve their
                        learning experience.
                    </p>

                    <div className="srp-grid-student">
                        {STUDENT_FEATURES.map((f) => (
                            <div className="srp-card" key={f.title}>
                                <div
                                    className="srp-card-icon"
                                    aria-hidden="true"
                                >
                                    <i className={f.icon}></i>
                                </div>
                                <p className="srp-card-title">{f.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* rating mocks */}
                    <div className="srp-rating-row">
                        <img
                            src={img5}
                            alt="Student rating preview"
                            className="srp-mock-img"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
