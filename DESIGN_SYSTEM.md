# 🌑 Muscle Buddy - Design System & Brand Guidelines

**Version :** 2.0
**Direction Artistique :** "Athletic Stealth" (Premium Dark Performance)
**Objectif UX :** Lisibilité absolue sous l'effort physique ("Sweaty Thumb Test"), réduction de la fatigue visuelle, concentration maximale.

---

## 1. Philosophie Visuelle
Fini les designs de fitness agressifs (néons purs, métal, noir total). Muscle Buddy adopte les codes des clubs privés haut de gamme : des tons profonds et chauds, une typographie hiérarchisée, et une lumière subtile pour guider l'action. 
**Règle d'or :** Aucun noir pur (`#000000`) ni blanc pur (`#FFFFFF`) n'est autorisé dans l'interface.

---

## 2. Typographie

Un trio typographique conçu pour séparer l'émotion (titres), l'instruction (corps) et la performance (données).

### A. Display (L'Émotion & La Marque)
- **Font-Family :** `Clash Display` (ou `Satoshi`)
- **Poids :** 500 (Medium), 600 (Semi-Bold)
- **Usage :** H1, H2, Noms des exercices.
- **Règle :** Toujours en majuscules (Uppercase) avec un tracking élargi (`tracking-wide`).
- **Classe Tailwind :** `.font-display`

### B. Interface (L'Instruction)
- **Font-Family :** `Inter`
- **Poids :** 400 (Regular), 500 (Medium)
- **Usage :** Boutons, labels (Charge, Répétitions, RIR), navigation.
- **Classe Tailwind :** `.font-sans`

### C. Data (La Performance) - *CRITIQUE*
- **Font-Family :** `IBM Plex Mono` (ou `JetBrains Mono`)
- **Poids :** 400 (Regular), 500 (Medium)
- **Usage :** TOUS les chiffres (Poids, Reps, Chronomètre, Statistiques).
- **Règle :** Obligatoire pour éviter le tressautement des chiffres lors de l'écoulement du timer (tabular nums).
- **Classe Tailwind :** `.font-mono`

---

## 3. Palette Chromatique (Tokens Tailwind)

### Fondations (Profondeur)
| Nom | Variable | Valeur Hex | Usage |
| :--- | :--- | :--- | :--- |
| **App** | `app` | `#1E1C1A` | Onyx Base - Fond global |
| **Surface** | `surface` | `#2A2826` | Card Surface - Fond des blocs |
| **Input** | `input-surface` | `#353330` | Input Surface - Fond cliquable |

### Textes (Contraste doux)
| Nom | Variable | Valeur Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `ivory` | `#F4F0EB` | Titres et Data |
| **Secondary** | `taupe` | `#9D9995` | Labels et instructions |
| **Muted** | `stone` | `#5C5A58` | Placeholders et bordures |

### Action & Sémantique
| Nom | Variable | Valeur Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Brand** | `brand` | `#D97746` | Terracotta/Ambre - Boutons CTA, Objectifs |
| **Success** | `sage` | `#7A8B6B` | Sage - Progression validée |
| **Danger** | `brick` | `#C85A5A` | Brick - Stagnation, actions destructives |

---

## 4. UI Framework : Formes & Élévations

En Dark Mode, l'élévation se fait par la lumière (bordures), pas par les ombres.

### Border Radius
- **Cartes Principales** : 16px (`rounded-2xl`)
- **Inputs & Badges** : 12px (`rounded-xl`)
- **Boutons d'Action (CTA)** : Pilule (`rounded-full`)

### Élévation (Inner Light)
- Pas de `box-shadow` classique.
- Utiliser une bordure haute ultra-fine sur les cartes : `border-t border-white/5` ou `border-input` pour simuler un éclairage zénithal.

### Hitboxes (Sweaty Thumb Rule)
- **TOUT** élément cliquable (boutons, inputs) doit mesurer au minimum **48x48px**.

---

## 5. Composants Clés (Specs)

### A. La Grille de Saisie (ExerciseCard)
- **Layout** : Disposition horizontale. Les 4 séries doivent tenir sur une seule ligne via CSS Grid (`grid-cols-4`).
- **Interaction** : Au focus, l'input perd sa bordure muted pour un anneau brand (`ring-1 ring-brand`).

### B. Objectif du Jour (Double Progression)
- Doit être l'élément le plus visible avant la saisie.
- **Style** : Fond `bg-brand/10`, bordure gauche pleine `border-l-4 border-brand`, texte en `text-primary`.

### C. Floating Timer (Dynamic Island)
- **Position** : Fixé en bas de l'écran (`fixed bottom-6 left-1/2 -translate-x-1/2`).
- **Style** : Forme pilule (`rounded-full`), fond `bg-app/90 backdrop-blur-md`, bordure `border border-input`.
- **Typographie** : Chiffres en `font-mono text-primary text-xl`.
