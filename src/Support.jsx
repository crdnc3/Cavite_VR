import React from 'react';
import Sidebar from './Sidebar';
import './Support.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function Support() {
  const contacts = [
    {
      name: 'Alister Realo',
      role: 'Website',
      email: 'alsterrealo23@gmail.com',
      phone: '0927 227 9583',
    },
    {
      name: 'Marvin Atienza',
      role: 'VR App',
      email: 'marvinhumpreyatienza@gmail.com',
      phone: '0977 073 6946',
    },
    {
      name: 'Raemil Amarillo',
      role: 'VR App',
      email: 'raemilvinceamarillo@gmail.com',
      phone: '0919 815 5894',
    },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div className="support-page">
      <Sidebar />
      <div className="support-main">
        <h2 className="support-title">Support Contacts</h2>
        <p className="support-description">
          If you need help, feel free to reach out to any of the admins below:
        </p>

        <div className="contact-list">
          {contacts.map((contact, index) => (
            <div className="contact-card" key={index}>
              <h3>{contact.name}</h3>
              <p className="contact-role"><strong>Ask him if it's for:</strong> {contact.role}</p>
              <p>
                <strong>Email:</strong> {contact.email}{' '}
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(contact.email)}
                  title="Copy Email"
                >
                  <i className="fas fa-clipboard"></i>
                </button>
              </p>
              <p>
                <strong>Phone:</strong> {contact.phone}{' '}
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(contact.phone)}
                  title="Copy Phone"
                >
                  <i className="fas fa-clipboard"></i>
                </button>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Support;
