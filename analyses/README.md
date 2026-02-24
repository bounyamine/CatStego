# Analyses – Groupe G1 (Chats)

## Objectif
Le dossier `analyses/` contient les scripts et fichiers nécessaires pour **tester et valider l'application de stéganographie** sur les images du groupe G1 (chats).  
Il permet de vérifier que les messages cachés dans les images sont correctement encodés et décodés, et de mesurer l’impact sur les images originales.

## Contenu
- `analyse_stegano.py` : script principal qui encode un message test dans chaque image de chats, le décode, compare l’image originale et codée, et génère un tableau de résultats.  
- `requirements.txt` : liste des dépendances Python nécessaires (`stegano`, `pillow`, `numpy`, `pandas`).  
- `README.md` : ce fichier explicatif.

## Fonctionnement
1. Parcourt toutes les images du groupe G1 (chats).  
2. Encode un message secret dans chaque image.  
3. Décodage pour vérifier la validité du message.  
4. Calcul de la différence moyenne entre image originale et image codée.  
5. Génération d'un fichier `resultats.csv` avec pour chaque image :
   - Nom de l’image  
   - Message correctement décodé (`True/False`)  
   - Différence moyenne entre images

## Rôle dans le projet
- Fournir aux étudiants **Data Science – chats (G1)** une analyse quantitative sur l’efficacité de la stéganographie.  
- Vérifier que les messages sont correctement cachés et récupérables.  
- Permettre à l’équipe de valider le bon fonctionnement de l’application avant la démonstration finale.

## Exécution
Dans le terminal :

```bash
cd analyses
python analyse_stegano.py