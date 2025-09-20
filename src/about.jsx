import React, { useEffect } from 'react';
import './about.css';
import kapitolyo from './assets/images/kapitolyo.png';

const About = () => {
    useEffect(() => {
        document.body.classList.add('about');
        document.documentElement.classList.add('about');

        return () => {
            document.body.classList.remove('about');
            document.documentElement.classList.remove('about');
        };
    }, []);

    return (
        <div className="about-container">
            {/* Compact Hero Section */}
            <section className="hera-section">
                <div className="hera-content">
                    <img
                        src={kapitolyo}
                        alt="Cavite Historical Landmark"
                        className="hera-image"
                    />
                    <div className="hera-text">
                        <h1>CAVITE: VR</h1>
                        <p className="hera-subtitle">Heritage Through Technology</p>
                        <div className="hera-description">
                            An innovative project preserving Cavite's historical landmarks
                            through immersive virtual reality experiences.
                        </div>
                    </div>
                </div>
            </section>

            {/* Inline Info Cards */}
            <section className="inline-cards-section">
            <div className="cards-container">
                <div className="info-card">
                <div className="card-header">
                    <i className="card-icon fas fa-bullseye"></i>
                    <h3>Our Mission</h3>
                    <span className="bottom-star">★</span>
                </div>
                <p>
                    To bring Cavite's rich history to life through interactive VR
                    experiences, making heritage accessible to students, tourists, and
                    history enthusiasts worldwide.
                </p>
                </div>

                <div className="info-card">
                <div className="card-header">
                    <i className="card-icon fas fa-eye"></i>
                    <h3>Our Vision</h3>
                    <span className="bottom-star">★</span>
                </div>
                <p>
                    We envision a future where heritage sites are experienced, not just
                    remembered. Bridging past and present through immersive technology.
                </p>
                </div>

                <div className="info-card">
                <div className="card-header">
                    <i className="card-icon fas fa-vr-cardboard"></i>
                    <h3>What Sets Us Apart</h3>
                    <span className="bottom-star">★</span>
                </div>
                <p>
                    Dynamic VR experiences that transport users to the past, making
                    history engaging and memorable unlike traditional static exhibits.
                </p>
                </div>
            </div>
            </section>


            {/* Advanced Team Section */}
            <section className="team-section" id="team">
                <div className="team-container">
                    <div className="team-header">
                        <h2>Meet Team RAA</h2>
                        <p className="team-subtitle">
                            Passionate innovators bringing heritage to life through technology
                        </p>
                    </div>

                    <div className="team-layout">
                        <a
                            href="https://www.facebook.com/alister.realo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="team-member"
                        >
                            <div className="member-avatar"></div>
                            <div className="member-info">
                                <h4>Alister Dylan Emmanuel M. Realo</h4>
                                <p className="member-role">
                                    Project Manager, Full Stack Web Developer
                                </p>
                                <p className="member-specialty">
                                    Leads the team with strong project management skills,
                                    ensuring smooth progress and seamless coordination. With
                                    full stack development expertise, oversees both the
                                    front-end and back-end of the website to deliver a reliable
                                    and user-friendly platform.
                                </p>
                            </div>
                        </a>

                        <a
                            href="https://www.facebook.com/marvinhumprey.atienza"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="team-member"
                        >
                            <div className="member-avatar"></div>
                            <div className="member-info">
                                <h4>Marvin Humprey Ulysses P. Atienza</h4>
                                <p className="member-role">
                                    Front-End Developer (VR App) & 3D Modeler
                                </p>
                                <p className="member-specialty">
                                    Crafts the Cavite VR app’s front-end with precision,
                                    designing an engaging and intuitive interface. Brings the
                                    virtual world to life through detailed 3D modeling, creating
                                    immersive experiences that showcase history in a modern and
                                    interactive way.
                                </p>
                            </div>
                        </a>

                        <a
                            href="https://www.facebook.com/raemil.amarillo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="team-member"
                        >
                            <div className="member-avatar"></div>
                            <div className="member-info">
                                <h4>Raemil Vince A. Amarillo</h4>
                                <p className="member-role">
                                    Researcher & Back-End Developer (VR App)
                                </p>
                                <p className="member-specialty">
                                    Drives the foundation of the project through comprehensive
                                    thesis documentation while powering the VR app’s back-end.
                                    Ensures the system runs efficiently and securely, combining
                                    research and technical expertise to strengthen both the
                                    academic and technical sides of the project.
                                </p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* Modern Footer CTA */}
            <section className="footer-cta">
                <div className="footer-content">
                    <h3>Join Our Heritage Journey</h3>
                    <p>
                        Connect with historians, educators, and heritage enthusiasts. Be part
                        of preserving Cavite's cultural legacy through cutting-edge virtual
                        reality technology.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default About;
