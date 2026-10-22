# H0D Token Tooltip

## v0.3.0 — Interface Actor commune

L'infobulle lit désormais en priorité les quatre interfaces communes H0D exposées par les Actors :

- `attributeBar.H0D_Health` → PV actuels / maximum ;
- `attributeBar.H0D_Defense` → DEF finale ;
- `attributeBar.H0D_Perception` → PER effective ;
- `attributeBar.H0D_Detection` → DET passive.

Les anciens champs PJ / Créature / Machine restent utilisés comme **fallback** afin que le module continue de fonctionner pendant une migration incomplète ou sur un ancien monde.

Les données spécifiques restent spécifiques : vitesse, portée de perception, sens spéciaux et capteurs machines ne sont pas fusionnés dans cette interface.


Module Foundry VTT v14 pour la campagne Zero Dawn utilisant Custom System Builder.

Affiche au survol d'un token, par défaut uniquement au MJ :
- PV actuels / max
- DEF
- Vitesse
- Perception quand elle existe comme statistique dédiée
- États principaux des machines

## Manifest Forge
https://github.com/freeberserk/h0d-token-tooltip/releases/latest/download/module.json

## Réglages
Game Settings > Configure Settings > Module Settings > H0D Token Tooltip


## Perception / Détection

Depuis la 0.2.0, l'infobulle MJ affiche PER, DET et portée de perception lorsqu'elles sont disponibles. Les PJ utilisent leur compétence Perception existante avec une portée humaine de 30 m par défaut. Les Créatures/PNJ peuvent exposer un sens spécial. Les Machines peuvent afficher leurs capteurs spécialisés portés par des pièces détachables, y compris lorsqu'un capteur est hors service.

Le réglage monde **MJ uniquement** reste activé par défaut.
