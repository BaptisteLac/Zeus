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
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-mb-surface transition-colors"
                >
                    <X className="w-5 h-5 text-mb-muted" />
                </button>

                <div className="p-8">
                    {userEmail ? (
                        // Already authenticated
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mb-success/10 flex items-center justify-center">
                                <Check className="w-8 h-8 text-mb-success" />
                            </div>
                            <h2 className="text-2xl font-display font-semibold text-mb-fg mb-2">
                                Connecté
                            </h2>
                            <p className="text-mb-muted mb-6">
                                {userEmail}
                            </p>
                            <p className="text-sm text-mb-muted mb-6">
                                Vos données sont automatiquement sauvegardées dans le cloud.
                            </p>
                            <button
                                onClick={handleSignOut}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-mb-surface text-mb-fg rounded-xl font-medium hover:bg-mb-surface-raised transition-colors disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Se déconnecter
                            </button>
                        </div>
                    ) : (
                        // Sign in/up form
                        <div>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 p-1 bg-mb-surface rounded-xl border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'signin'
                                        ? 'bg-mb-primary text-white shadow-sm'
                                        : 'text-mb-muted hover:text-mb-fg'
                                        }`}
                                >
                                    Se connecter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('signup')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'signup'
                                        ? 'bg-mb-primary text-white shadow-sm'
                                        : 'text-mb-muted hover:text-mb-fg'
                                        }`}
                                >
                                    Créer un compte
                                </button>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-display font-semibold text-mb-fg mb-2">
                                    {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
                                </h2 >
                                <p className="text-mb-muted text-sm">
                                    {mode === 'signin'
                                        ? 'Connectez-vous à votre compte'
                                        : 'Créez votre compte pour sauvegarder vos données'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-mb-muted mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        required
                                        className="w-full px-4 py-3 bg-mb-input border border-transparent rounded-xl text-mb-fg placeholder:text-mb-muted/50 focus:outline-none focus:ring-2 focus:ring-mb-primary/20 focus:border-mb-primary transition-colors"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-mb-muted mb-2">
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
                                            className="w-full px-4 py-3 pr-12 bg-mb-input border border-transparent rounded-xl text-mb-fg placeholder:text-mb-muted/50 focus:outline-none focus:ring-2 focus:ring-mb-primary/20 focus:border-mb-primary transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mb-muted hover:text-mb-fg transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {mode === 'signup' && (
                                        <p className="text-xs text-mb-muted/70 mt-1">
                                            Minimum 6 caractères
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-sm text-mb-error bg-mb-error/10 px-3 py-2 rounded-lg border border-mb-error/20">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-6 py-3 bg-mb-primary text-white rounded-xl font-medium hover:bg-mb-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (mode === 'signin' ? 'Connexion...' : 'Création...') : (mode === 'signin' ? 'Se connecter' : 'Créer mon compte')}
                                </button>

                                <p className="text-xs text-mb-muted/70 text-center">
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
