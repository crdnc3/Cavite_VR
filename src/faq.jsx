import React, { useState, useEffect } from 'react';
import './faq.css';

const FAQ = () => {
    useEffect(() => {
        document.body.classList.add('faq');
        document.documentElement.classList.add('faq');

        return () => {
            document.body.classList.remove('faq');
            document.documentElement.classList.remove('faq');
        };
    }, []);

    const [openQuestion, setOpenQuestion] = useState(null);

    const toggleQuestion = (question) => {
        setOpenQuestion(openQuestion === question ? null : question);
    };

    return (
        <div>
            <div className="faq-content">
                <div className="faq-card">
                    <div className="faq-text">
                        <h1>Frequently Asked Questions</h1>

                        <div className={`faq-item ${openQuestion === 1 ? 'open' : ''}`} onClick={() => toggleQuestion(1)}>
                            <div className="faq-question">What is Cavite VR?</div>
                            {openQuestion === 1 && (
                                <div className="faq-answer">
                                    Cavite VR is an innovative project dedicated to preserving and promoting Cavite’s historical landmarks through immersive virtual reality experiences.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openQuestion === 2 ? 'open' : ''}`} onClick={() => toggleQuestion(2)}>
                            <div className="faq-question">How does CaviteVR work?</div>
                            {openQuestion === 2 && (
                                <div className="faq-answer">
                                    Using virtual reality technology, we recreate historical landmarks in a digital environment, allowing users to explore and experience them as they were in the past.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openQuestion === 3 ? 'open' : ''}`} onClick={() => toggleQuestion(3)}>
                            <div className="faq-question">Is Cavite VR free to use?</div>
                            {openQuestion === 3 && (
                                <div className="faq-answer">
                                    Yes, Cavite VR is free to use. We aim to make history accessible to everyone.
                                </div>
                            )}
                        </div>

                        {/* 🔹 NEW QUESTIONS BELOW 🔹 */}

                        <div className={`faq-item ${openQuestion === 4 ? 'open' : ''}`} onClick={() => toggleQuestion(4)}>
                            <div className="faq-question">What is the CaviteVR website?</div>
                            {openQuestion === 4 && (
                                <div className="faq-answer">
                                    The CaviteVR website primarily provides graphical content and historical information about Cavite’s heritage sites.
                                    To fully experience the project in virtual reality, users are encouraged to download the CaviteVR mobile application.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openQuestion === 5 ? 'open' : ''}`} onClick={() => toggleQuestion(5)}>
                            <div className="faq-question">What hardware do I need to use?</div>
                            {openQuestion === 5 && (
                                <div className="faq-answer">
                                    To explore CaviteVR in virtual reality, you must first download the CaviteVR mobile application.
                                    A VR headset (compatible with your mobile device) and a controller are also required to navigate and interact within the virtual environment.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openQuestion === 6 ? 'open' : ''}`} onClick={() => toggleQuestion(6)}>
                            <div className="faq-question">Is the CaviteVR application compatible with any device?</div>
                            {openQuestion === 6 && (
                                <div className="faq-answer">
                                    At present, the CaviteVR application is only supported on Android devices.
                                    It requires a minimum operating system of Android 13 (Tiramisu) and is compatible with all subsequent versions up to the latest release.
                                </div>
                            )}
                        </div>

                        <div className="contact-info">
                            For more inquiries contact us via email: <b>cavitevr221@gmail.com</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
