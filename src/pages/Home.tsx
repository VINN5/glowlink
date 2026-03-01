import { Link } from 'react-router-dom';
import { Sparkles, Star, Shield, Clock, ArrowRight, Scissors, Palette, Hand, Smile } from 'lucide-react';

const categories = [
  { icon: Scissors, label: 'Hair', color: 'bg-pink-100 text-pink-600' },
  { icon: Palette, label: 'Makeup', color: 'bg-rose-100 text-rose-600' },
  { icon: Hand, label: 'Nails', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: Smile, label: 'Skincare', color: 'bg-orange-100 text-orange-600' },
];

const features = [
  { icon: Star, title: 'Top Rated Specialists', desc: 'Browse verified professionals with real client reviews.' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Every specialist is vetted and verified by our team.' },
  { icon: Clock, title: 'Easy Booking', desc: 'Book appointments in seconds, anytime anywhere.' },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rose-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-pink-200 rounded-full px-4 py-1.5 text-sm text-pink-600 font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Your Beauty, Your Way
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
              Beauty Specialist
            </span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Connect with top-rated beauty professionals near you. Book hair, makeup, nails, skincare and more — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/specialists"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white px-8 py-3.5 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all"
            >
              Find Specialists <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-8 py-3.5 rounded-full font-semibold hover:border-pink-300 hover:shadow-md transition-all"
            >
              Join as Specialist
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(({ icon: Icon, label, color }) => (
              <Link
                key={label}
                to={`/specialists?category=${label.toLowerCase()}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all group"
              >
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Why Choose GlowLink?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Glow?</h2>
        <p className="text-pink-100 mb-8 text-lg">Join thousands of clients and specialists on GlowLink.</p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-pink-600 px-8 py-3.5 rounded-full font-semibold hover:shadow-xl transition-all"
        >
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};

export default Home;
