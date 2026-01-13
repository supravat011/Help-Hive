import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from './App';
import { Activity, ArrowRight, User as UserIcon, Lock, Shield } from 'lucide-react';
import authBg from './auth_bg.png';
import { authApi } from './src/api/authApi';

const Login = () => {
    const { setUser } = useAppContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'volunteer' ? 'volunteer' : 'user';

    const [role, setRole] = useState<'user' | 'volunteer'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authApi.login({ email, password });
            authApi.saveAuthData(response.token, response.user);
            setUser(response.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.error || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-brand-dark relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${authBg})` }}></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-brand-red p-2 transform -skew-x-12">
                            <Activity className="h-6 w-6 text-white transform skew-x-12" />
                        </div>
                        <span className="font-heading font-bold text-2xl tracking-tighter text-white uppercase italic">
                            Help<span className="text-brand-red">Hive</span>
                        </span>
                    </div>
                    <h1 className="text-6xl font-heading font-bold uppercase leading-tight mb-6">
                        Community <br /> Response <br /> <span className="text-brand-red">Redefined</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-md font-light">
                        Join thousands of verified volunteers and neighbors helping each other in real-time.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-500 uppercase tracking-widest">
                    &copy; 2024 HelpHive Platform
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="max-w-md w-full bg-white p-8 md:p-10 shadow-2xl border-t-8 border-brand-red">

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-heading font-bold text-brand-dark uppercase mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Please sign in to your account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Role Toggles */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('user')}
                            className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${role === 'user'
                                ? 'border-brand-red bg-red-50 text-brand-red'
                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                }`}
                        >
                            <UserIcon className="w-6 h-6 mb-2" />
                            <span className="font-bold uppercase text-xs tracking-wider">I Need Help</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('volunteer')}
                            className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${role === 'volunteer'
                                ? 'border-brand-accent bg-amber-50 text-brand-dark'
                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                }`}
                        >
                            <Shield className="w-6 h-6 mb-2" />
                            <span className="font-bold uppercase text-xs tracking-wider">Volunteer</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 p-3 focus:border-brand-dark focus:ring-0 transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider">Password</label>
                                <a href="#" className="text-xs text-brand-red font-bold uppercase hover:underline">Forgot?</a>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 pr-10 focus:border-brand-dark focus:ring-0 transition-colors"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center py-4 px-6 text-white font-heading font-bold uppercase tracking-wider text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all ${role === 'user' ? 'bg-brand-red hover:bg-red-700' : 'bg-brand-dark hover:bg-slate-800'
                                }`}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                            {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <p className="text-slate-500 text-sm">
                            Don't have an account? {' '}
                            <Link to={`/register?mode=${role}`} className="text-brand-dark font-bold uppercase tracking-wide hover:text-brand-red transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
