# analyse_stegano.py
# Script d'analyse stéganographie pour le groupe G1 (chats)

from stegano import lsb
from PIL import Image
import numpy as np
import os
import pandas as pd

# Dossier contenant les images de chats
dossier_chats = "../images/G1_chats/"  # adapte le chemin selon ton projet

# Message test
message_test = "Test Stéganographie TPE"

# Liste pour stocker les résultats
resultats = []

# Vérifier que le dossier existe
if not os.path.exists(dossier_chats):
    print("Dossier non trouvé :", dossier_chats)
else:
    # Parcours des images du groupe G1 (chats)
    for fichier in os.listdir(dossier_chats):
        if fichier.endswith(".png"):
            chemin_image = os.path.join(dossier_chats, fichier)
            try:
                # Encoder le message dans l'image
                image_secrete = lsb.hide(chemin_image, message_test)
                chemin_secret = os.path.join(dossier_chats, "secret_" + fichier)
                image_secrete.save(chemin_secret)

                # Décoder le message
                message_decode = lsb.reveal(chemin_secret)

                # Comparer image originale et image codée
                original = np.array(Image.open(chemin_image))
                encode = np.array(Image.open(chemin_secret))
                difference = np.mean(np.abs(original - encode))

                # Stocker le résultat
                resultats.append({
                    "Image": fichier,
                    "Message OK": message_decode == message_test,
                    "Difference moyenne": round(difference, 4)
                })

                print("Analyse OK :", fichier)

            except Exception as e:
                print("Erreur sur :", fichier)
                print(e)

# Générer un tableau final
df = pd.DataFrame(resultats)
print("\nRESULTATS\n")
print(df)

# Sauvegarder dans un fichier CSV
df.to_csv("resultats.csv", index=False)
print("\nFichier resultats.csv créé")