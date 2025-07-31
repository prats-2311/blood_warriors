import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStatus } from '../hooks/useAuth';
import Button, { HeartIcon, ShieldIcon, LocationIcon, BellIcon } from './ui/Button';
import Card from './ui/Card';
import './LandingPage.css';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuthStatus();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    livesSaved: 1247,
    activeDonors: 892,
    emergencyRequests: 156,
    citiesCovered: 25
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Animate stats on load
  useEffect(() => {
    const animateStats = () => {
      const targets = {
        livesSaved: 1247,
        activeDonors: 892,
        emergencyRequests: 156,
        citiesCovered: 25
      };

      Object.keys(targets).forEach(key => {
        let current = 0;
        const target = targets[key];
        const increment = target / 100;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
        }, 20);
      });
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__container">
          <Link to="/" className="landing-nav__brand">
            <div className="landing-nav__logo">
              <HeartIcon />
            </div>
            <span className="landing-nav__title">Blood Warriors</span>
          </Link>

          <div className="landing-nav__actions">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Join the Fight
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <HeartIcon />
            <span>Saving Lives Together</span>
          </div>
          
          <h1 className="hero-title">
            Every Drop Counts in the
            <span className="text-gradient"> Fight Against Thalassemia</span>
          </h1>
          
          <p className="hero-subtitle">
            Join Blood Warriors - India's first AI-powered platform connecting Thalassemia patients 
            with life-saving blood donors. Get emergency support, find compatible donors, and be part 
            of a community that never gives up.
          </p>
          
          <div className="hero-actions">
            <Link to="/register">
              <Button variant="sos" size="xl" icon={<HeartIcon />}>
                Join as Patient
              </Button>
            </Link>
            <Link to="/register?type=donor">
              <Button variant="primary" size="xl" icon={<ShieldIcon />}>
                Become a Donor
              </Button>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat__number">{stats.livesSaved.toLocaleString()}+</div>
              <div className="hero-stat__label">Lives Saved</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat__number">{stats.activeDonors.toLocaleString()}+</div>
              <div className="hero-stat__label">Active Donors</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat__number">{stats.emergencyRequests.toLocaleString()}+</div>
              <div className="hero-stat__label">Emergency Responses</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat__number">{stats.citiesCovered}+</div>
              <div className="hero-stat__label">Cities Covered</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual__main">
            <div className="hero-visual__pulse"></div>
            <div className="hero-visual__heart">
              <HeartIcon />
            </div>
          </div>
          <div className="hero-visual__orbits">
            <div className="orbit orbit--1"></div>
            <div className="orbit orbit--2"></div>
            <div className="orbit orbit--3"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Blood Warriors?</h2>
            <p className="section-subtitle">
              Advanced technology meets compassionate care to create the most effective 
              blood donation network for Thalassemia patients in India.
            </p>
          </div>

          <div className="features-grid">
            <Card variant="glass" padding="lg" hover className="feature-card">
              <div className="feature-icon feature-icon--sos">
                <BellIcon />
              </div>
              <h3 className="feature-title">Emergency SOS Network</h3>
              <p className="feature-description">
                Instant alerts to nearby donors within 15km radius. Get help in under 5 minutes 
                during critical emergencies with our AI-powered matching system.
              </p>
              <div className="feature-stats">
                <span className="feature-stat">~5 min response</span>
                <span className="feature-stat">15km coverage</span>
              </div>
            </Card>

            <Card variant="glass" padding="lg" hover className="feature-card">
              <div className="feature-icon feature-icon--ai">
                <AIIcon />
              </div>
              <h3 className="feature-title">Thalassemia CareBot</h3>
              <p className="feature-description">
                24/7 AI companion providing personalized health guidance, medication reminders, 
                and emotional support tailored specifically for Thalassemia patients.
              </p>
              <div className="feature-stats">
                <span className="feature-stat">24/7 available</span>
                <span className="feature-stat">Personalized care</span>
              </div>
            </Card>

            <Card variant="glass" padding="lg" hover className="feature-card">
              <div className="feature-icon feature-icon--rewards">
                <RewardsIcon />
              </div>
              <h3 className="feature-title">Donor Rewards Program</h3>
              <p className="feature-description">
                Exclusive perks and rewards for our hero donors. From healthcare discounts 
                to entertainment vouchers - because heroes deserve recognition.
              </p>
              <div className="feature-stats">
                <span className="feature-stat">Exclusive perks</span>
                <span className="feature-stat">Hero recognition</span>
              </div>
            </Card>

            <Card variant="glass" padding="lg" hover className="feature-card">
              <div className="feature-icon feature-icon--network">
                <LocationIcon />
              </div>
              <h3 className="feature-title">Smart Donor Network</h3>
              <p className="feature-description">
                Advanced geolocation and compatibility matching ensures you find the right 
                donor at the right time, every time.
              </p>
              <div className="feature-stats">
                <span className="feature-stat">Smart matching</span>
                <span className="feature-stat">Real-time tracking</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How Blood Warriors Works</h2>
            <p className="section-subtitle">
              Simple, fast, and effective - get the help you need in just a few steps.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Sign Up & Verify</h3>
                <p className="step-description">
                  Create your profile with medical details and get verified by our healthcare partners.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Request Blood</h3>
                <p className="step-description">
                  Use our SOS feature or schedule requests. Our AI finds compatible donors instantly.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Get Connected</h3>
                <p className="step-description">
                  Donors receive notifications and can respond immediately. Real-time coordination.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Save Lives</h3>
                <p className="step-description">
                  Complete the donation process with full support and tracking from our platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <Card variant="primary" padding="xl" className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Join the Fight?</h2>
              <p className="cta-subtitle">
                Every second counts when it comes to saving lives. Join thousands of warriors 
                who are making a difference in the Thalassemia community.
              </p>
              <div className="cta-actions">
                <Link to="/register">
                  <Button variant="secondary" size="xl" icon={<HeartIcon />}>
                    Join as Patient
                  </Button>
                </Link>
                <Link to="/register?type=donor">
                  <Button variant="outline" size="xl" icon={<ShieldIcon />}>
                    Become a Donor
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <HeartIcon />
            </div>
            <h3 className="footer-title">Blood Warriors</h3>
            <p className="footer-description">
              Empowering Thalassemia patients with life-saving connections.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
              <a href="#about">About Us</a>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact Us</a>
              <a href="#emergency">Emergency</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#medical">Medical Disclaimer</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Blood Warriors. All rights reserved. Saving lives, one drop at a time.</p>
        </div>
      </footer>
    </div>
  );
};

// Additional Icon Components
const AIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const RewardsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export default LandingPage;