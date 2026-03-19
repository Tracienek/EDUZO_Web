import "./landing.css";
import { Link } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import HeroCarousel from "./HeroCarousel";
import { useTranslation } from "react-i18next";

import img1 from "../../assets/hero/img10.jpg";
import img2 from "../../assets/hero/img5.jpg";
import img3 from "../../assets/hero/img3.jpg";
import img4 from "../../assets/hero/img6.jpg";
import img5 from "../../assets/hero/img8.jpg";

export default function LandingPage() {
    const { t } = useTranslation();

    const FEATURES = t("landing.features", { returnObjects: true });

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
                            {t("landing.hero.title1")}
                            <span aria-hidden="true">
                                <br />
                            </span>
                            &amp; {t("landing.hero.title2")}
                        </h1>

                        <p className="lp-hero-desc">{t("landing.hero.desc")}</p>

                        <div className="landing-hero-actions">
                            <Link className="lp-btn" to="/auth/signUp">
                                {t("landing.hero.cta")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="lp-section" id="services">
                <div className="lp-container">
                    <h2 className="lp-section-title">
                        {t("landing.featuresTitle")}
                    </h2>

                    <p className="lp-section-subtitle">
                        {t("landing.featuresSubtitle")}
                    </p>

                    <div className="lp-grid">
                        {FEATURES.map((f) => (
                            <div className="lp-card" key={f.id}>
                                <div className="lp-icon">
                                    <i className={f.icon}></i>
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section className="lp-about" id="about">
                <div className="lp-container">
                    <div className="lp-about-text">
                        <h2 className="lp-section-title">
                            {t("landing.about.title")}
                        </h2>

                        <p className="lp-about-subtitle">
                            {t("landing.about.p1")}
                        </p>

                        <p className="lp-about-subtitle">
                            {t("landing.about.p2")}
                        </p>

                        <p className="lp-about-subtitle">
                            {t("landing.about.p3")}
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="lp-section">
                <div className="lp-container">
                    <div className="lp-cta-box">
                        <h2>{t("landing.cta.title")}</h2>
                        <p>{t("landing.cta.desc")}</p>

                        <div className="landing-hero-actions">
                            <Link className="lp-btn" to="/auth/signUp">
                                {t("landing.cta.button")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
