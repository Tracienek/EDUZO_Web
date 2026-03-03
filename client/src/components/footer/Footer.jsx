import "./footer.css";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";

const Footer = () => {
    return (
        <footer className="lp-footer">
            <div className="lp-container">
                <div className="lp-footer-line" />
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <img
                            src={logo}
                            alt="Eduzo logo"
                            className="lp-footer-logo"
                        />
                        <div className="lp-footer-socials">
                            <a href="#" aria-label="Facebook">
                                <i className="fa-brands fa-facebook" />
                            </a>
                            <a href="#" aria-label="Instagram">
                                <i className="fa-brands fa-square-instagram" />
                            </a>
                            <a href="#" aria-label="Github">
                                <i className="fa-brands fa-github" />
                            </a>
                        </div>
                    </div>

                    <div className="lp-footer-cols">
                        <div className="lp-footer-col">
                            <h4>Legal</h4>
                            <p>Lorem ipsum</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Developers</h4>
                            <p>Pham Tran Bao Tran</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Help & support</h4>
                            <p>Lorem ipsum</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Our address:</h4>
                            <p>Lorem ipsum</p>
                        </div>
                    </div>
                </div>

                <div className="lp-copyright">
                    Copyright © 2025 EDUZO – All rights reserved.
                </div>
            </div>
        </footer>
    );
};
export default Footer;
