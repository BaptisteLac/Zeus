import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Les DEUX Chartes Graphiques Strictes tirées de DESIGN_SYSTEM.md
const THEME_DATA: Record<string, any> = {
    'theme-elite-stealth-final': {
        name: 'Option A: Elite Stealth',
        description: 'Vibe: Garmin Marq, technical, silencieux, lisible.',

        // Fonds et Textes
        background: '#111318',      // Gris Carbone profond (pas de noir pur)
        surface: '#1E2128',         // Fond des conteneurs
        foreground: '#F5F5F7',      // Blanc cassé
        foregroundMuted: '#8B92A5', // Métal/Gris pour labels

        // Émotion & Action
        primary: '#E05D36',         // Cuivre Anodisé
        primaryPressed: '#C24D29',

        // Bordures & Ombres (Flat)
        border: '#2A2E37',
        shadowOpacity: 0.1, // Très léger, optionnel

        // Formes
        radiusCard: 16,
        radiusAction: 9999, // Pillule pour actions

        // Boutons
        btn: {
            primary: { bg: '#E05D36', text: '#FFFFFF', pressedBg: '#C24D29', pressedText: '#FFFFFF' },
            secondary: { bg: '#1E2128', text: '#F5F5F7', pressedBg: '#2A2E37', pressedText: '#F5F5F7', border: '#2A2E37' },
            ghost: { bg: 'transparent', text: '#8B92A5', pressedBg: 'transparent', pressedText: '#FFFFFF' }
        },

        // Typo
        fontHeading: 'System',
        fontSans: 'System',
        fontMono: 'Menlo',
    },
    'theme-premium-wellness-final': {
        name: 'Option B: Premium Wellness',
        description: 'Vibe: Spa haut de gamme, organique, ancré.',

        // Fonds et Textes
        background: '#F6F4F0',      // Sable Chaud
        surface: '#FFFFFF',         // Ou un blanc cassé encore plus clair
        foreground: '#2D2B2A',      // Anthracite
        foregroundMuted: '#736F6D', // Taupe

        // Émotion & Action
        primary: '#1A4331',         // Vert Forêt Profond
        primaryPressed: '#265C45',

        // Bordures & Ombres (Flat)
        border: '#E8E3D8',
        shadowOpacity: 0.05,

        // Formes
        radiusCard: 16, // Maîtrisé pour l'espace
        radiusAction: 9999, // Pillule

        // Boutons
        btn: {
            primary: { bg: '#1A4331', text: '#F6F4F0', pressedBg: '#265C45', pressedText: '#FFFFFF' },
            secondary: { bg: '#E5E0D8', text: '#2D2B2A', pressedBg: '#D1C9C0', pressedText: '#2D2B2A', border: '#E5E0D8' },
            ghost: { bg: 'transparent', text: '#736F6D', pressedBg: 'transparent', pressedText: '#2D2B2A' }
        },

        // Typo
        fontHeading: 'System', // Idéalement un Serif élégant si on l'avait
        fontSans: 'System',
        fontMono: 'System', // ou Mono léger
    },
};

export default function FinalDesignShowcase() {
    const router = useRouter();
    const [themeKey, setThemeKey] = useState('theme-elite-stealth-final');
    const t = THEME_DATA[themeKey];

    // Interactive mock states

    const s = StyleSheet.create({
        container: { flex: 1, backgroundColor: t.background },
        header: {
            paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24,
            backgroundColor: t.background,
            borderBottomWidth: 1, borderColor: t.border
        },
        navTitle: {
            fontSize: 22, fontWeight: '800', color: t.foreground,
            fontFamily: t.fontHeading
        },
        themePill: {
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999,
            borderWidth: 1,
        },
        sectionTitle: {
            fontSize: 14, fontWeight: '700', color: t.foregroundMuted,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4
        },
        card: {
            backgroundColor: t.surface, borderRadius: t.radiusCard, padding: 20,
            borderWidth: 1, borderColor: t.border,
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
            shadowOpacity: t.shadowOpacity, shadowRadius: 12, elevation: 2,
        },

        // Typographical Hierarchy (Extreme Contrast)
        dataMassive: { fontSize: 36, fontWeight: '700', color: t.foreground, fontFamily: t.fontMono, letterSpacing: -1 },
        dataRegular: { fontSize: 20, fontWeight: '600', color: t.foreground, fontFamily: t.fontMono },
        labelSmall: { fontSize: 13, fontWeight: '600', color: t.foregroundMuted },

    });

    return (
        <View style={s.container}>
            {/* Top Navigation & Theme Switcher */}
            <View style={s.header}>
                <View className="flex-row items-center justify-between mb-4">
                    <Pressable onPress={() => router.back()} hitSlop={20} className="-ml-2">
                        <Text style={{ color: t.foregroundMuted, fontWeight: '500', fontSize: 16 }}>← Back</Text>
                    </Pressable>
                </View>
                <Text style={s.navTitle}>Comparatif Final</Text>
                <Text style={{ color: t.foregroundMuted, marginTop: 4, fontSize: 14 }}>
                    Visualisez les couleurs et boutons exacts.
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
                    {Object.entries(THEME_DATA).map(([key, data]) => (
                        <Pressable
                            key={key}
                            onPress={() => setThemeKey(key)}
                            style={({ pressed }) => [
                                s.themePill,
                                {
                                    backgroundColor: themeKey === key ? t.foreground : 'transparent',
                                    borderColor: themeKey === key ? t.foreground : t.border,
                                    opacity: pressed ? 0.7 : 1,
                                    flex: 1, alignItems: 'center'
                                }
                            ]}
                        >
                            <Text style={{
                                fontWeight: '600', fontSize: 13,
                                color: themeKey === key ? t.background : t.foreground
                            }}>
                                {key.includes('stealth') ? 'Option A: Stealth' : 'Option B: Wellness'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 40 }}>

                {/* SECTION 1: La Palette & L'Ambiance */}
                <View>
                    <Text style={s.sectionTitle}>1. Couleurs & Description</Text>
                    <View style={s.card}>
                        <Text style={{ fontSize: 18, color: t.foreground, fontWeight: '700', marginBottom: 8 }}>{t.name}</Text>
                        <Text style={{ color: t.foregroundMuted, fontSize: 14, marginBottom: 20 }}>{t.description}</Text>

                        {/* Color Swatches */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {[
                                { bg: t.background, name: 'Background' },
                                { bg: t.surface, name: 'Surface' },
                                { bg: t.foreground, name: 'Texte' },
                                { bg: t.accent || '#C47A3D', name: 'Focus' },
                                { bg: t.emotional || '#E05D36', name: 'Validation' },
                                { bg: t.achievement || '#FF8C42', name: 'PR' }
                            ].map((c) => (
                                <View key={c.name} style={{ width: '45%' }}>
                                    <View style={{ height: 40, backgroundColor: c.bg, borderRadius: 8, borderWidth: 1, borderColor: t.border, marginBottom: 4 }} />
                                    <Text style={{ color: t.foreground, fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
                                    <Text style={{ color: t.foregroundMuted, fontSize: 10, fontFamily: t.fontMono }}>{c.bg}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* SECTION 2: Le Système de Boutons */}
                <View>
                    <Text style={s.sectionTitle}>2. Boutons & HitSlop</Text>
                    <View style={[s.card, { gap: 16 }]}>

                        {/* Primaire */}
                        <View>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Primary (Marque / Valider)</Text>
                            <Pressable
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? t.btn.primary.pressedBg : t.btn.primary.bg,
                                    paddingVertical: 16, borderRadius: t.radiusAction, alignItems: 'center'
                                })}
                            >
                                {({ pressed }) => (
                                    <Text style={{ color: pressed ? t.btn.primary.pressedText : t.btn.primary.text, fontWeight: '700', fontSize: 16 }}>
                                        Bouton Primaire
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {/* Secondaire */}
                        <View>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Secondary (Surface / Contraste bas)</Text>
                            <Pressable
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? t.btn.secondary.pressedBg : t.btn.secondary.bg,
                                    borderWidth: 1, borderColor: t.btn.secondary.border,
                                    paddingVertical: 16, borderRadius: t.radiusAction, alignItems: 'center'
                                })}
                            >
                                {({ pressed }) => (
                                    <Text style={{ color: pressed ? t.btn.secondary.pressedText : t.btn.secondary.text, fontWeight: '600', fontSize: 15 }}>
                                        Bouton Secondaire
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {/* Ghost */}
                        <View>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Ghost (Actions inline / HitSlop Massif)</Text>
                            <Pressable
                                hitSlop={30} // The invisible fat finger
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? t.btn.ghost.pressedBg : t.btn.ghost.bg,
                                    paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.8 : 1
                                })}
                            >
                                {({ pressed }) => (
                                    <Text style={{ color: pressed ? t.btn.ghost.pressedText : t.btn.ghost.text, fontWeight: '600', fontSize: 15 }}>
                                        + Ajouter Exercice (HitSlop 30px)
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                    </View>
                </View>

                {/* SECTION 3: La Data & Système Émotionnel */}
                <View>
                    <Text style={s.sectionTitle}>3. Card UI & Système Émotionnel (v2.0)</Text>

                    <View style={s.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: t.foreground }}>Bench Press</Text>
                            {/* Timer */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                borderWidth: 1, borderColor: t.border,
                                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999
                            }}>
                                <Text style={{ color: t.foreground, fontWeight: '700', fontFamily: t.fontMono, fontSize: 14 }}>01:45</Text>
                            </View>
                        </View>

                        {/* Focus (Couche 1) */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Série en cours (Focus - accent)</Text>
                            <View style={{
                                paddingVertical: 16, paddingHorizontal: 16,
                                backgroundColor: t.background,
                                borderRadius: t.radiusCard,
                                borderWidth: 1, borderColor: t.accent || '#C47A3D', // Highlight
                                flexDirection: 'row', alignItems: 'center'
                            }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.labelSmall}>Set 2</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={[s.dataMassive, { color: t.accent || '#C47A3D' }]}>100</Text>
                                    <Text style={{ color: t.foregroundMuted, fontSize: 16, marginLeft: 2, marginRight: 6 }}>×</Text>
                                    <Text style={[s.dataMassive, { color: t.accent || '#C47A3D' }]}>8</Text>
                                </View>
                            </View>
                        </View>

                        {/* Validation (Couche 2) */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Série validée (Validation - emotional)</Text>
                            <View style={{
                                paddingVertical: 16, paddingHorizontal: 16,
                                backgroundColor: t.surface,
                                borderRadius: t.radiusCard,
                                borderWidth: 1, borderColor: t.border,
                                flexDirection: 'row', alignItems: 'center',
                                opacity: 0.7
                            }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.emotional || '#E05D36', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                                    </View>
                                    <Text style={s.labelSmall}>Set 1</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={[s.dataRegular, { color: t.foregroundMuted }]}>100</Text>
                                    <Text style={{ color: t.foregroundMuted, fontSize: 14, marginLeft: 2, marginRight: 6 }}>×</Text>
                                    <Text style={[s.dataRegular, { color: t.foregroundMuted }]}>8</Text>
                                </View>
                            </View>
                        </View>

                        {/* Achievement (Couche 3) */}
                        <View>
                            <Text style={[s.labelSmall, { marginBottom: 8 }]}>Record PR (Achievement - achievement)</Text>
                            <View style={{
                                paddingVertical: 16, paddingHorizontal: 16,
                                backgroundColor: t.background,
                                borderRadius: t.radiusCard,
                                borderWidth: 1, borderColor: t.achievement || '#FF8C42',
                                flexDirection: 'row', alignItems: 'center',
                            }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: t.achievement || '#FF8C42' }}>
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>PR</Text>
                                    </View>
                                    <Text style={s.labelSmall}>Set 3</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={[s.dataRegular, { color: t.achievement || '#FF8C42' }]}>102.5</Text>
                                    <Text style={{ color: t.foregroundMuted, fontSize: 14, marginLeft: 2, marginRight: 6 }}>×</Text>
                                    <Text style={[s.dataRegular, { color: t.achievement || '#FF8C42' }]}>8</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}
