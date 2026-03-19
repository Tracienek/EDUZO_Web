import "./services.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import img3 from "../../assets/hero/img3.jpg";
import img5 from "../../assets/hero/img5.jpg";

export default function ServicesPage() {
    const { t } = useTranslation();

    const teacherFeatures = t("services.teacherFeatures", {
        returnObjects: true,
    });

    const studentFeatures = t("services.studentFeatures", {
        returnObjects: true,
    });

    return (
        <div className="srp-page">
            {/* HERO */}
            <section className="srp-hero">
                <div className="srp-container">
                    <div className="srp-hero-inner">
                        <p className="srp-kicker">
                            {t("services.hero.kicker")}
                        </p>

                        <h1 className="srp-hero-title">
                            {t("services.hero.title1")} <br />
                            {t("services.hero.title2")}
                        </h1>

                        <p className="srp-hero-desc">
                            {t("services.hero.desc")}
                        </p>

                        <div className="srp-hero-actions">
                            <Link
                                className="srp-btn srp-btn-primary"
                                to="/auth/signUp"
                            >
                                {t("services.hero.cta")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TEACHER FEATURES */}
            <section className="srp-section">
                <div className="srp-container">
                    <h2 className="srp-section-title">
                        {t("services.teacher.title")}
                    </h2>

                    <p className="srp-section-subtitle">
                        {t("services.teacher.subtitle")}
                    </p>

                    <div className="srp-grid">
                        {teacherFeatures.map((f) => (
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

                    <div
                        className="srp-mock srp-mock-dashboard"
                        aria-label={t("services.teacher.dashboardAria")}
                    >
                        <img
                            src={img3}
                            alt={t("services.teacher.dashboardAlt")}
                            className="srp-mock-img"
                        />
                    </div>
                </div>
            </section>

            {/* STUDENTS */}
            <section className="srp-section">
                <div className="srp-container">
                    <p className="srp-kicker srp-kicker-center">
                        {t("services.student.kicker")}
                    </p>

                    <h2 className="srp-section-title">
                        {t("services.student.title1")}{" "}
                        <span className="srp-accent">
                            {t("services.student.title2")}
                        </span>
                    </h2>

                    <p className="srp-section-subtitle">
                        {t("services.student.subtitle")}
                    </p>

                    <div className="srp-grid-student">
                        {studentFeatures.map((f) => (
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

                    <div className="srp-rating-row">
                        <img
                            src={img5}
                            alt={t("services.student.ratingAlt")}
                            className="srp-mock-img"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
