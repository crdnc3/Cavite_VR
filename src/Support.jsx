import React from 'react';
import Sidebar from './Sidebar';
import './Support.css';

function Support() {
  const contacts = [
    {
      name: 'Alister Realo',
      email: 'alsterrealo23@gmail.com',
      phone: '0927 227 9583',
    },
    {
      name: 'Marvin Atienza',
      email: 'marvinhumpreyatienza@gmail.com',
      phone: '0977 073 6946',
    },
    {
      name: 'Raemil Amarillo',
      email: 'raemilvinceamarillo@gmail.com',
      phone: '0919 815 5894',
    },
  ];

  return (
    <div className="support-page">
      <Sidebar />
      <div className="support-main">
        <h2 className="support-title">Support Contacts</h2>
        <p className="support-description">If you need help, feel free to reach out to any of the admins below:</p>

        <div className="contact-list">
          {contacts.map((contact, index) => (
            <div className="contact-card" key={index}>
              <h3>{contact.name}</h3>
              <p><strong>Email:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a></p>
              <p><strong>Phone:</strong> <a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Support;
