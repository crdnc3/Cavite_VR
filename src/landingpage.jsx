import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './landingpage.css';
import mckp1 from './assets/images/mckp1.png';
import mckp2 from './assets/images/mckp2.png';
import cyllw from './assets/images/cyllw.png';
import cblu from './assets/images/cblu.png';
import cbluu from './assets/images/cbluu.png';
import cred from './assets/images/cred.png';
import gplay from './assets/images/gplay.png';
import bonifacio from './assets/videos/bonifacio.mp4';


const videoData = [
    { src: bonifacio, title: 'Bonifacio Trial House' },
    { src: 'src/assets/videos/imus.mp4', title: 'Battle of Imus Monuments' },
    { src: 'src/assets/videos/alapan.mp4', title: 'Battle of Alapan Site' },
    { src: 'src/assets/videos/zapote.mp4', title: 'Zapote Battlefield' },
    { src: 'src/assets/videos/baldomero.mp4', title: 'Baldomero Aguinaldo Shrine' },
];

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('landing-page');
        document.body.classList.add('landing-page');
        return () => {
            document.documentElement.classList.remove('landing-page');
            document.body.classList.remove('landing-page');
        };
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="landing-wrapper">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-text">
                    <h1 className="landing-title">WELCOME TO</h1>
                    <h2 className="landing-subtitle">CAVITE VR</h2>
                    <p className="landing-body">
                        Step into the past and explore Cavite’s rich heritage through immersive virtual reality. Cavite VR brings historical landmarks to life, allowing you to walk through centuries-old churches, iconic battle sites, and cultural treasures—all from the comfort of your device.
                    </p>
                    <div className="hero-buttons">
                        <button className="google-play-button">
                            <img src={gplay} alt="Google Play" className="google-play-icon" />
                            Get it on Google Play
                        </button>
                        <button className="lgn-btn" onClick={handleLoginClick}>
                            Log In
                        </button>
                    </div>
                </div>
                <div className="mockup-images">
                    <img src={mckp1} alt="Mockup 1" className="mockup mockup-1" />
                    <img src={mckp2} alt="Mockup 2" className="mockup mockup-2" />
                    <img src={cyllw} alt="Big Circle" className="big-circle" />
                    <img src={cblu} alt="Right Circle" className="right-circle" />
                    <img src={cbluu} alt="Bottom Circle 2" className="bottom-circle" />
                    <img src={cred} alt="Bottom Right Circle" className="botryt-circle" />
                    <img src={cred} alt="Bottom Right Circle" className="botry-circle" />
                </div>

                <div className="scroll-down-indicator">
                    <span>Scroll Down</span>
                    <div className="arrow-down" />
                </div>
            </section>

            {/* Video Sections */}
            {videoData.map((video, idx) => (
                <section className="video-section" key={idx}>
                    <video
                        className="background-video"
                        src={video.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <div className="video-overlay">
                        <h2>{video.title}</h2>
                    </div>
                </section>
            ))}
        </div>
    );
};

export default LandingPage;
