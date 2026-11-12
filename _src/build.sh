#!/usr/bin/env bash
# Régénère les pages HTML à la racine à partir de _src/ :
# en-tête commun (_head.part) + contenu de la page (X.body) + pied commun (_foot.part).
# Usage : bash _src/build.sh   (depuis la racine du dépôt)
set -e
cd "$(dirname "$0")/.."
S=_src
build(){ # fichier  body  titre  lien-actif-du-menu
  { sed "s|__TITLE__|$3|; s|__A_$4__| aria-current=\"page\"|; s|__A_[a-z]*__||g" $S/_head.part
    cat $S/$2.body; cat $S/_foot.part; } > "$1.html"
}
build index                  index       "Nathan Dabonneville" index
build amdm                   amdm        "Alternance AMDM"     amdm
build projets                projets     "Projets"             projets
build competences            competences "Compétences"         competences
build about                  about       "À propos"            about
build contact                contact     "Contact"             contact
build project-noflyer        noflyer     "NoFlyer"             projets
build project-ctf-case-404   case        "CTF Case 404"        projets
build project-ecommerce-php  ecommerce   "E-commerce PHP"      projets
build project-code-game-jam  cgj         "Code Game Jam 2025"  projets
build project-crazy-game-jam crazy       "Crazy Game Jam"      projets
echo "Pages régénérées."
