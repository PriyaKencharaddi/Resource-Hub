 import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload,
  ArrowRight,
  FileText,
  Code,
  Calculator,
  Eye,
  Target,
  Lightbulb,
  Users,
  CheckCircle,
} from 'lucide-react';

// ----------------------
// Hero Section
// ----------------------
const HeroSection: React.FC = () => {
  return (
    <section
      className="relative bg-cover bg-center min-h-[85vh] py-16 flex items-center justify-center"
      style={{ backgroundImage: "url('/campus.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Logo */}
        <img
          src="/logo.jpg"
          alt="Site Logo"
          className="mx-auto mb-6 w-20 sm:w-24 h-auto"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Computer Science & Engineering <br />
          <span className="text-blue-300">Resource Hub</span>
        </h1>
        <p className="text-base sm:text-lg mb-8 text-blue-100 max-w-2xl mx-auto">
          Our platform provides teacher-approved materials, including Exam
          papers, Presentations, Reports, and study guides.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 flex-wrap">
          <Link
            to="/signup"
            className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-100 transition text-center"
          >
            Join Our College Network
          </Link>
          <Link
            to="/resources"
            className="bg-transparent border border-white text-white font-semibold px-6 py-3 rounded-md hover:bg-white hover:text-blue-700 transition text-center"
          >
            Browse Resources
          </Link>
        </div>
      </div>
    </section>
  );
};

// ----------------------
// Home Page
// ----------------------
const Home: React.FC = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Study Notes',
      description:
        'Access comprehensive notes for all subjects across 8 semesters',
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: 'Programming Resources',
      description: 'Code snippets, projects, and programming tutorials',
    },
    {
      icon: <Calculator className="h-8 w-8" />,
      title: 'Question Papers',
      description: 'Question papers from previous examinations',
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: 'Easy Sharing',
      description: 'Upload and share your resources with fellow students',
    },
  ];

  const semesters = Array.from({ length: 8 }, (_, i) => ({ number: i + 1 }));

  return (
    <div className="min-h-screen bg-white">

      {/* College Header */}
      <header className="bg-white border-b border-blue-200 py-4 px-4 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex flex-col items-center md:flex-row md:items-start md:justify-between gap-4">
          {/* Left - Logo + Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img
              src="/clg-logo.png"
              alt="College Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-1"
            />
            <div className="text-[10px] text-gray-700 font-medium leading-tight">
              <p>Estb. 2003</p>
              <p>ISO 9001:2015 Certified</p>
            </div>
          </div>

          {/* Center - College Name */}
          <div className="text-center max-w-3xl px-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-snug">
              Smt. Kamala & Sri Venkappa M. Agadi <br className="hidden sm:inline" />
              College of Engineering and Technology, Lakshmeshwar - 582116
            </h1>
            <p className="text-xs sm:text-sm text-red-700 font-semibold mt-1">
              ಶ್ರೀಮತಿ ಕಾಮಲಾ ಮತ್ತು ಶ್ರೀ ವೆಂಕಪ್ಪ ಎಂ. ಅಗಡಿ ಇಂಜಿನಿಯರಿಂಗ್ ಮತ್ತು ತಾಂತ್ರಿಕ ಮಹಾವಿದ್ಯಾಲಯ, ಲಕ್ಷ್ಮೇಶ್ವರ
            </p>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-1">
              Approved by AICTE & Affiliated to VTU Belagavi, Karnataka <br />
              <strong>Mobile:</strong> 9448120344 | <strong>Email:</strong> info@agadcengcollege.com
            </p>
          </div>

          {/* Right - NAAC Badge */}
          <div className="flex flex-col items-center md:items-end">
            <img
              src="/naac.png"
              alt="NAAC B++ Grade"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </div>
        </div>

        {/* Bottom - Department Name */}
        <div className="mt-3 pt-2 border-t border-gray-100 text-center">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-blue-800 tracking-wide uppercase font-serif">
            Department of Computer Science & Engineering
          </h2>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Vision & Mission */}
      <section className="py-10 sm:py-16 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 md:p-10 border border-blue-200">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700 mb-3">Vision & Mission</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
                Our guiding principles and goals to empower the next generation of technocrats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              {/* Vision */}
              <div className="bg-blue-100 rounded-xl p-5 sm:p-8 shadow-md hover:shadow-lg transition">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="bg-blue-600 text-white rounded-full p-2.5 sm:p-3">
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Vision</h3>
                </div>
                <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                  Aspire to become a preferred institute by transforming rural youths into global technocrats through continual excellence in engineering education, innovation, lifelong learning, and ethical values.
                </p>
              </div>

              {/* Mission */}
              <div className="bg-blue-100 rounded-xl p-5 sm:p-8 shadow-md hover:shadow-lg transition">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="bg-blue-600 text-white rounded-full p-2.5 sm:p-3">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Mission</h3>
                </div>
                <ul className="space-y-4 sm:space-y-5">
                  <li className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="text-blue-600 mt-1 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                      To inculcate outcome-based quality education in engineering through experiential learning with state-of-the-art infrastructure.
                    </p>
                  </li>
                  <li className="flex items-start gap-3 sm:gap-4">
                    <Lightbulb className="text-blue-600 mt-1 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                      To promote industry-institute collaborations to encourage innovations in thrust areas by providing an ecosystem.
                    </p>
                  </li>
                  <li className="flex items-start gap-3 sm:gap-4">
                    <Users className="text-blue-600 mt-1 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                      To emphasize on cutting-edge technologies that are sustainable and beneficial to different sectors of society.
                    </p>
                  </li>
                  <li className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="text-blue-600 mt-1 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                      To develop professionals by inculcating discipline, integrity, and ethical values.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for CSE Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            From first semester basics to final year reports, find all the resources you need in one place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform"
              >
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Semesters */}
       <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
  <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
    <h2 className="text-4xl font-bold text-blue-800 mb-2">
      Explore by Semester
    </h2>
    <p className="text-lg text-gray-600 mb-10">
      Quick access to semester-specific study materials and resources.
    </p>

    {/* Horizontal scroll container */}
    <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
      {semesters.map((semester, idx) => (
        <Link
          key={idx}
          to={`/semesters/${semester.number}`}
          className="min-w-[160px] bg-white border border-blue-100 shadow-md rounded-2xl p-6 flex-shrink-0 hover:scale-105 hover:shadow-xl transition"
        >
          <div className="text-4xl font-extrabold text-blue-700 mb-2">
            {semester.number}
          </div>
          <div className="text-sm text-gray-800 font-medium">
            Semester {semester.number}
          </div>
        </Link>
      ))}
    </div>

    <div className="mt-10">
      <Link
        to="/semesters"
        className="inline-flex items-center px-6 py-3 bg-blue-700 text-white rounded-full shadow hover:bg-blue-800 transition"
      >
        View All Semesters <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </div>
  </div>
</section>


      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white text-center">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Join the Community?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Help your fellow CSE students succeed by sharing your knowledge and accessing quality resources.
          </p>
          {!currentUser && (
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition"
            >
              Join Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
