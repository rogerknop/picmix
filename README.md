# PicMix

### Setup / Installation
Hier die Schritte für die Installation. Der letzte git Befehl bewirkt, dass die lokalen Einstellungen nicht gepusht werden:
```
git clone https://github.com/rogerknop/picmix.git
npm install
git update-index assume-unchanged config/local.json
```

### Konfiguration
Die Default Einstellungen sind in config/default.json definiert.  

read liest alle infos ein
Bei Bedarf können einzelne Attribute in der Datei config/active.json überschrieben werden.
in data/collections.json nach error suchen