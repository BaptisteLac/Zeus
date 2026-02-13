
# Refonte Design "Atelier Athletique" - Muscu Tracker

## Objectif
Transformer l'identite visuelle de l'application d'un style gradient violet/flashy vers un design premium wellness minimaliste inspire des studios haut de gamme (Equinox, Kinfolk, Aesop).

## Vue d'ensemble des changements

La logique metier (double progression, blocs, rotation A/B/C, localStorage) reste **100% inchangee**. Seuls le design system et les composants visuels sont modifies.

---

## Etape 1 : Fondations du Design System

### 1.1 Typographie (index.html)
Remplacer l'import Google Fonts actuel (Inter seul) par trois familles :
- **Cormorant Garamond** (display/titres elegants, serif)
- **Inter** (interface, corps de texte, sans-serif)
- **IBM Plex Mono** (donnees chiffrees, monospace)

### 1.2 Palette et variables CSS (src/index.css)
Remplacer entierement les variables HSL violet/pourpre par la palette warm :
- Backgrounds : cream (#faf8f5), linen (#f5f1eb)
- Texte : charcoal (#2b2b2b), graphite (#5a5a5a), stone (#9a9a9a)
- Accents : terracotta (#c77a5c), sage (#8b9d83), slate (#556270)
- Touch premium : gold shimmer (#d4af37) pour les records
- Suppression du mode dark (non necessaire pour cette direction artistique)

### 1.3 Tailwind config (tailwind.config.ts)
- Ajouter les font families (display, sans, mono)
- Ajouter les font sizes custom (display-xl, display-lg, heading, body, label, data)
- Remplacer les couleurs semantiques (primary, success, warning, destructive) par les nouvelles
- Ajouter les ombres soft/lifted
- Ajouter la transition smooth (cubic-bezier custom)
- Border-radius max 8px

### 1.4 Utilitaires CSS (src/index.css)
- Supprimer les gradients violet (gradient-primary, text-gradient)
- Ajouter une texture noise en overlay sur le body (optionnel, via pseudo-element)

---

## Etape 2 : Composants restructures

### 2.1 SessionHeader
Transformation du header gradient violet en header elegant :
- Fond cream, pas de gradient
- Titre en Cormorant Garamond light (large, serif)
- "Seance A" affiche en grand, date du jour en dessous (stone, uppercase, letter-spacing)
- Badges Bloc/Semaine en style label discret (border fine, uppercase, petite taille)
- Separateur ultra-fin en bas
- Boutons export/import/reset en icones discretes (texte stone, sans fond colore)
- Banniere de changement de bloc en style sage (vert doux) au lieu du vert flashy

### 2.2 ExerciseCard
Refonte complete de la carte :
- **Numero d'exercice** : position en dehors du flow, grand format (font-display, light, stone), style editorial
- **Nom de l'exercice** : font-display serif, taille heading, charcoal
- **Badge progression** : 
  - Charge augmentee : fond sage/10, texte sage, border fine
  - Maintenir : fond slate/10, texte slate, neutre
  - Stagnation : fond terracotta/10, texte terracotta (pas de rouge agressif)
- **Stats precedentes** : grille 3 colonnes, labels en uppercase letter-spacing (font label), valeurs en font-mono
- **Objectif du jour** : encadre avec border-left terracotta ou sage, fond linen, texte sobre
- **Inputs** : 
  - Style border-bottom uniquement (pas de border complete)
  - Texte centre, font-mono pour les chiffres
  - Focus : border-bottom terracotta
  - Labels en uppercase, letter-spacing, taille 13px
- **Plage cible** : texte stone discret, uppercase
- **Padding genereux** : p-8 au lieu de p-4
- **Border-radius** : 8px max (rounded-lg, pas rounded-2xl)
- **Ombre** : shadow-soft subtile

### 2.3 RestTimer
- Affichage du temps en font-mono, grande taille, couleur charcoal (pas de couleur primaire violette)
- Bouton demarrer : fond terracotta, texte warmWhite, border-radius 8px
- Bouton stop : fond transparent, border fine charcoal
- Barre de progression ultra-fine (hauteur 2px) sous le timer
- Animations smooth (pas de scale agressif)

### 2.4 Bouton "Terminer la seance" (Index.tsx)
- Fond terracotta (pas de gradient)
- Texte warmWhite, uppercase, letter-spacing
- Border-radius 8px
- Ombre lifted
- Quand tout est sauvegarde : fond sage au lieu de vert flashy
- Transition smooth au hover (-translate-y-0.5)

---

## Etape 3 : Layout et details

### 3.1 Page Index (src/pages/Index.tsx)
- Container max-width ajuste avec padding genereux (px-6, py-8)
- Espacement entre cards : space-y-6
- Fond de page cream
- Zone du bouton fixe en bas : fond cream avec gradient fade vers transparent

### 3.2 Suppression du fichier App.css
Le fichier `src/App.css` contient des styles Vite par defaut inutilises. Il sera vide ou supprime.

---

## Fichiers modifies

| Fichier | Type de modification |
|---|---|
| `index.html` | Import des 3 fonts Google |
| `src/index.css` | Palette CSS, variables, utilitaires |
| `tailwind.config.ts` | Fonts, couleurs, ombres, transitions, spacing |
| `src/components/SessionHeader.tsx` | Refonte visuelle complete |
| `src/components/ExerciseCard.tsx` | Refonte visuelle complete |
| `src/components/RestTimer.tsx` | Refonte visuelle |
| `src/pages/Index.tsx` | Layout, bouton, espacement |
| `src/App.css` | Nettoyage (suppression contenu inutile) |

## Fichiers NON modifies (logique intacte)

- `src/lib/types.ts`
- `src/lib/program.ts`
- `src/lib/progression.ts`
- `src/lib/storage.ts`
- `src/App.tsx`

---

## Resume visuel

L'application passera d'un look "app fitness coloree" a un look "atelier d'entrainement premium" : fond creme chaleureux, typographie serif elegante pour les titres, chiffres en monospace, accents terracotta et sage, espaces genereux, et details soignes (borders fines, ombres subtiles, transitions douces).
