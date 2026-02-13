import { useState } from 'react';
import { signInWithEmail, signOut, getCurrentUser } from '../lib/cloudStorage';
import { X, Mail, Check, LogOut } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    onAuthChange: () => void;
}

export function AuthModal({ isOpen, onClose, userEmail, onAuthChange }: AuthModalProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signInWithEmail(email);

        if (result.success) {
            setSent(true);
        } else {
            setError(result.error || 'Erreur lors de l\'envoi');
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
                    ) : sent ? (
                        // Email sent
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-terracotta/10 flex items-center justify-center">
                                <Mail className="w-8 h-8 text-terracotta" />
                            </div>
                            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                                Email envoyé !
                            </h2>
                            <p className="text-stone mb-4">
                                Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.
                            </p>
                            <p className="text-xs text-stone/70">
                                Pensez à vérifier vos spams si vous ne voyez rien.
                            </p>
                        </div>
                    ) : (
                        // Sign in form
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                                    Sauvegarder dans le cloud
                                </h2>
                                <p className="text-stone text-sm">
                                    Protégez vos données et synchronisez entre appareils
                                </p>
                            </div>

                            <form onSubmit={handleSignIn} className="space-y-4">
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
                                    {loading ? 'Envoi...' : 'Envoyer le lien de connexion'}
                                </button>

                                <p className="text-xs text-stone/70 text-center">
                                    Pas de mot de passe requis. Vous recevrez un lien magique par email.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
