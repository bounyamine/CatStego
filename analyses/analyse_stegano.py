# analyse_stegano.py

from stegano import lsb
from PIL import Image
import numpy as np
import os
import pandas as pd

"""
Script d'analyse de la stéganographie

Fonctions :
- Encoder un message dans les images
- Décoder le message
- Comparer image originale et image codée
- Générer un tableau de résultats
"""

# Dossiers contenant les images
groupes = {
    "G1": "../images/G1_chats/",
    "G2": "../images/G2_chiens/",
    "G3": "../images/G3_voitures/",
    "G4": "../images/G4_maisons/"
}

# Message test
message_test = "Test Stéganographie TPE"

# Liste résultats
resultats = []


for groupe, dossier in groupes.items():

    if not os.path.exists(dossier):
        print("Dossier non trouvé:", dossier)
        continue

    for fichier in os.listdir(dossier):

        if fichier.endswith(".png"):

            chemin_image = os.path.join(dossier, fichier)

            try:

                # Encoder message
                image_secrete = lsb.hide(chemin_image, message_test)

                chemin_secret = os.path.join(
                    dossier,
                    "secret_" + fichier
                )

                image_secrete.save(chemin_secret)


                # Décoder message
                message_decode = lsb.reveal(chemin_secret)


                # Comparaison images

                original = np.array(
                    Image.open(chemin_image)
                )

                encode = np.array(
                    Image.open(chemin_secret)
                )

                difference = np.mean(
                    np.abs(original - encode)
                )


                # Stockage résultat

                resultats.append({

                    "Groupe": groupe,
                    "Image": fichier,
                    "Message OK":
                    message_decode == message_test,

                    "Difference moyenne":
                    round(difference,4)

                })


                print("Analyse OK :", fichier)


            except Exception as e:

                print("Erreur :", fichier)
                print(e)



# Tableau final

df = pd.DataFrame(resultats)

print("\nRESULTATS\n")

print(df)



# Sauvegarde CSV

df.to_csv("resultats.csv", index=False)


print("\nFichier resultats.csv créé")