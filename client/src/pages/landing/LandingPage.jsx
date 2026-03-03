import "./landing.css";
import { Link } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import HeroCarousel from "./HeroCarousel";

import img1 from "../../assets/hero/img1.png";
import img2 from "../../assets/hero/img2.png";
import img3 from "../../assets/hero/img3.png";
import img4 from "../../assets/hero/img4.png";
import img5 from "../../assets/hero/img5.png";

const FEATURES = [
    {
        id: "class-management",
        icon: "fa-solid fa-school",
        title: "Class Management",
        desc: "Create and organize classes with ease. Track students, schedules, and materials all in one place.",
    },
    {
        id: "student-feedback",
        icon: "fa-solid fa-comment",
        title: "Student Feedback",
        desc: "Collect meaningful feedback from students in a simple, student-friendly interface that encourages honest responses.",
    },
    {
        id: "student-tracking",
        icon: "fa-solid fa-user-group",
        title: "Student Tracking",
        desc: "Monitor student enrollment, participation, and engagement across all your classes with clear analytics.",
    },
    {
        id: "rating-system",
        icon: "fa-solid fa-star",
        title: "Rating System",
        desc: "Visual star ratings make it easy for students to quickly rate their experience and for teachers to gauge satisfaction.",
    },
    {
        id: "feedback-analytics",
        icon: "fa-solid fa-chart-line",
        title: "Feedback Analytics",
        desc: "Track feedback trends over time to understand what’s working and identify areas for improvement.",
    },
    {
        id: "simple-interface",
        icon: "fa-solid fa-chalkboard",
        title: "Simple Interface",
        desc: "Clean, intuitive design that both teachers and students can navigate easily without training.",
    },
];

export default function LandingPage() {
    return (
        <div className="lp-page">
            {/* HERO */}
            <section className="lp-hero">
                <div className="lp-container">
                    <div className="lp-hero-inner">
                        <HeroCarousel
                            images={[img1, img2, img3, img4, img5]}
                            intervalMs={3500}
                        />
                        <h1 className="lp-hero-title">
                            Simplify Classroom Management{" "}
                            <span aria-hidden="true">
                                <br />
                            </span>
                            <span className="sr-only"> and </span>
                            &amp; Student Feedback
                        </h1>

                        <p className="lp-hero-desc">
                            EDUZO helps teachers manage classes efficiently
                            while giving students a simple, friendly way to
                            share feedback and stay connected with their
                            learning journey.
                        </p>

                        <div className="landing-hero-actions">
                            <Link className="lp-btn" to="/auth/signUp">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="lp-section" id="services">
                <div className="lp-container">
                    <h2 className="lp-section-title">
                        Everything You Need in One Platform
                    </h2>
                    <p className="lp-section-subtitle">
                        Built for simplicity and efficiency, EDUZO reduces
                        administrative complexity while improving communication.
                    </p>

                    <div className="lp-grid">
                        {FEATURES.map((f) => (
                            <div className="lp-card" key={f.id}>
                                <div className="lp-icon" aria-hidden="true">
                                    <i className={f.icon}></i>
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lp-about" id="about">
                <div className="lp-container">
                    <div className="lp-about-text">
                        <h2 className="lp-section-title" id="about">
                            About EDUZO
                        </h2>
                        <p className="lp-about-subtitle">
                            EDUZO is a student-developed education platform
                            created to simplify classroom management and improve
                            communication between teachers and students. Our
                            goal is to reduce administrative workload for
                            teachers while providing students with an easy and
                            accessible way to share their feedback. <br />{" "}
                            <br /> I believe that effective learning
                            environments are built on clear organization and
                            open communication. By combining class management,
                            scheduling, and anonymous student feedback into a
                            single platform, EDUZO helps educators better
                            understand their classrooms and continuously improve
                            the learning experience. <br /> <br /> EDUZO is
                            designed with simplicity and usability in mind,
                            making it suitable for both small classes and larger
                            learning environments without requiring complex
                            setup or training.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="lp-section" id="about">
                <div className="lp-container">
                    <div className="lp-cta-box">
                        <h2>Ready to Transform Your Classroom?</h2>
                        <p>
                            Join EDUZO today and experience a simpler, more
                            efficient way to manage classes and collect student
                            feedback.
                        </p>
                        <div className="landing-hero-actions">
                            <Link className="lp-btn" to="/auth/signUp">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
