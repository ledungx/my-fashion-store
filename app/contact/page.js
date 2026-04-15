'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Send, CheckCircle, ExternalLink } from 'lucide-react';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setSubmitted(true);
        setLoading(false);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                .contact-page * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
                .contact-input {
                    width: 100%;
                    padding: 14px 18px;
                    border: 1.5px solid #e8e8e8;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: 'Inter', sans-serif;
                    color: #333;
                    background: #fafafa;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                }
                .contact-input:focus {
                    border-color: #F05A5A;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(240,90,90,0.08);
                }
                .info-card {
                    background: #fff;
                    border: 1.5px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    transition: box-shadow 0.25s, transform 0.25s;
                }
                .info-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                    transform: translateY(-2px);
                }
                .info-card-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: #fff5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    background: #111;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .submit-btn:hover { background: #F05A5A; transform: translateY(-1px); }
                .submit-btn:disabled { background: #999; cursor: not-allowed; transform: none; }
                .social-btn {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: #f5f5f5;
                    border: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s, color 0.2s;
                    text-decoration: none;
                    color: #555;
                    flex-shrink: 0;
                    line-height: 1;
                }
                .social-btn:hover { background: #F05A5A; color: #fff; transform: translateY(-2px); }
                .map-container { 
                    border-radius: 16px; 
                    overflow: hidden; 
                    height: 100%;
                    min-height: 500px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                }
            `}</style>

            <main className="contact-page">
                {/* Hero Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                    padding: '80px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(240,90,90,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(240,90,90,0.05)', pointerEvents: 'none' }} />

                    <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-1px' }}>
                        Contact <span style={{ color: '#F05A5A' }}>Us</span>
                    </h1>
                    <p style={{ color: '#aaa', marginTop: '12px', fontSize: '15px' }}>
                        We'd love to hear from you — our team is always here to help.
                    </p>
                    {/* Breadcrumb */}
                    <div style={{ marginTop: '20px', fontSize: '13px', color: '#777', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                        <Link href="/" style={{ color: '#aaa', textDecoration: 'none', transition: 'color 0.2s' }}>Home</Link>
                        <span style={{ color: '#555' }}>/</span>
                        <span style={{ color: '#F05A5A' }}>Contact Us</span>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '80px 40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>

                        {/* Left — Map */}
                        <div>
                            <div className="map-container">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2866.4!2d-84.676!3d45.0228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4d4dc4bbed4765d9%3A0x8de9b02ae32cef89!2s1782%20O'Rourke%20Blvd%2C%20Gaylord%2C%20MI%2049735!5e0!3m2!1sen!2sus!4v1686000000000!5m2!1sen!2sus"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: '500px', display: 'block' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Store Location"
                                />
                            </div>
                        </div>

                        {/* Right — Info + Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                            {/* Info Cards 2x2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="info-card">
                                    <div className="info-card-icon">
                                        <MapPin size={20} color="#F05A5A" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F05A5A', marginBottom: '6px' }}>Address</div>
                                        <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>1782 O'Rourke Blvd,<br />Gaylord, MI 49735, USA</div>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-card-icon">
                                        <Phone size={20} color="#F05A5A" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F05A5A', marginBottom: '6px' }}>Phone</div>
                                        <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
                                            <a href="tel:8553773888" style={{ color: '#555', textDecoration: 'none' }}>855-377-3888</a>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>Mon–Fri, 9am–6pm EST</div>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-card-icon">
                                        <Mail size={20} color="#F05A5A" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F05A5A', marginBottom: '6px' }}>Email</div>
                                        <a href="mailto:contact@mozcloth.com" style={{ fontSize: '13px', color: '#555', display: 'block', textDecoration: 'none', lineHeight: 1.8 }}>contact@mozcloth.com</a>
                                        <a href="mailto:support@mozcloth.com" style={{ fontSize: '13px', color: '#555', display: 'block', textDecoration: 'none' }}>support@mozcloth.com</a>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-card-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F05A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                            <circle cx="12" cy="12" r="4"/>
                                            <circle cx="17.5" cy="6.5" r="1" fill="#F05A5A" stroke="none"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F05A5A', marginBottom: '10px' }}>Follow Us</div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {/* Instagram */}
                                            <a href="https://www.instagram.com/mozcloth/" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                                    <circle cx="12" cy="12" r="4"/>
                                                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                                                </svg>
                                            </a>
                                            {/* Facebook */}
                                            <a href="https://www.facebook.com/mozcloth/" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Facebook">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                                                </svg>
                                            </a>
                                            {/* Twitter / X */}
                                            <a href="https://twitter.com/mozcloth" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Twitter">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '16px', padding: '36px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: '0 0 8px' }}>Drop Us a Line</h2>
                                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 28px', lineHeight: 1.7 }}>
                                    Have any questions? Feel free to get in touch — we'll reply as soon as possible.
                                </p>

                                {submitted ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <CheckCircle size={56} color="#4caf50" style={{ marginBottom: '16px' }} />
                                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Message Sent!</h3>
                                        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name *</label>
                                                <input
                                                    type="text" name="name" required
                                                    placeholder="Your name"
                                                    value={form.name} onChange={handleChange}
                                                    className="contact-input"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Email *</label>
                                                <input
                                                    type="email" name="email" required
                                                    placeholder="Your email"
                                                    value={form.email} onChange={handleChange}
                                                    className="contact-input"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
                                            <input
                                                type="text" name="subject"
                                                placeholder="e.g., Order inquiry, Sizing help..."
                                                value={form.subject} onChange={handleChange}
                                                className="contact-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Message *</label>
                                            <textarea
                                                name="message" required rows={5}
                                                placeholder="Write your message here..."
                                                value={form.message} onChange={handleChange}
                                                className="contact-input"
                                                style={{ resize: 'vertical', minHeight: '140px' }}
                                            />
                                        </div>

                                        <button type="submit" className="submit-btn" disabled={loading}>
                                            {loading ? (
                                                <>Sending...</>
                                            ) : (
                                                <><Send size={16} /> Send Message</>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Hours Banner */}
                <div style={{ background: '#f9f9f9', borderTop: '1px solid #eee', padding: '50px 40px' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', textAlign: 'center' }}>
                        {[
                            { day: 'Monday – Friday', hours: '08:00 – 20:00' },
                            { day: 'Saturday', hours: '09:00 – 21:00' },
                            { day: 'Sunday', hours: '13:00 – 22:00' },
                        ].map(({ day, hours }) => (
                            <div key={day} style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1.5px solid #f0f0f0' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F05A5A', marginBottom: '8px' }}>{day}</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#111' }}>{hours}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
