import { useState } from 'react';
import { signUp, signInWithPassword, signOut } from '../lib/cloudStorage';
import { X, Check, LogOut, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    onAuthChange: () => void;
}

export function AuthModal({ isOpen, onClose, userEmail, onAuthChange }: AuthModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let result;
        if (mode === 'signup') {
            result = await signUp(email, password);
        } else {
            result = await signInWithPassword(email, password);
        }

        if (result.success) {
            // Connexion réussie
            onAuthChange();
            onClose();
            // Reset form
            setEmail('');
            setPassword('');
        } else {
            setError(result.error || 'Erreur lors de l\'authentification');
        }

        setLoading(false);
    };

    const handleSignOut = async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
        onAuthChange();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border border-border">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone/10 transition-colors"
                >
                    <X className="w-5 h-5 text-stone" />
                </button>

                <div className="p-8">
                    {userEmail ? (
                        // Already authenticated
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-terracotta/10 flex items-center justify-center">
                                <Check className="w-8 h-8 text-terracotta" />
                            </div>
                            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                                Connecté
                            </h2>
                            <p className="text-stone mb-6">
                                {userEmail}
                            </p>
                            <p className="text-sm text-stone mb-6">
                                Vos données sont automatiquement sauvegardées dans le cloud.
                            </p>
                            <button
                                onClick={handleSignOut}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone/10 text-foreground rounded-xl font-medium hover:bg-stone/20 transition-colors disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Se déconnecter
                            </button>
                        </div>
                    ) : (
                        // Sign in/up form
                        <div>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 p-1 bg-stone/5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'signin'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-stone hover:text-foreground'
                                        }`}
                                >
                                    Se connecter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('signup')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'signup'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-stone hover:text-foreground'
                                        }`}
                                >
                                    Créer un compte
                                </button>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                                    {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
                                </h2>
                                <p className="text-stone text-sm">
                                    {mode === 'signin'
                                        ? 'Connectez-vous à votre compte'
                                        : 'Créez votre compte pour sauvegarder vos données'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        required
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-xl text-foreground placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {mode === 'signup' && (
                                        <p className="text-xs text-stone/70 mt-1">
                                            Minimum 6 caractères
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (mode === 'signin' ? 'Connexion...' : 'Création...') : (mode === 'signin' ? 'Se connecter' : 'Créer mon compte')}
                                </button>

                                <p className="text-xs text-stone/70 text-center">
                                    {mode === 'signin'
                                        ? 'Vos données sont sécurisées et synchronisées dans le cloud'
                                        : 'Vos données seront automatiquement sauvegardées'}
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
