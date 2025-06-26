# PicMix

## Setup / Installation
Hier die Schritte für die Installation:
```
git clone https://github.com/rogerknop/picmix.git
npm install
```

## PicMix Prozeß
Jedes Verzeichnis repräsintiert eine Kollektion. Es werden alle Fotos/ Videos eingelesen mit dem entsprechenden Zeitstempel.  
Pro Kollektion kann ein Offset definiert werden, so dass man die Fotos/ Videos im Ergebnis in der richtigen Reihenfolge erhält.  
Dieser Offset kann entweder manuell angegeben werden, oder über ein Referenzbild aus einer anderen Kollektion.  
Diese Referenzbilder könnten erstellt worden sein über ein Foto/ Video, was die beiden betroffenen Geräte von sich selbst gleichzeitig gemacht haben.

### Read - Event Infos einlesen
```
npm run read
```
*Read* fragt alle Infos ab und liest die Verzeichnisse ein und speichert das Ergebnis in der Datei *data/[Eventname]-control.json*.  
Bei Bedarf können einzelne Attribute in der Datei *data/[Eventname]-control.json* überschrieben werden. Zum Beispiel manuell eine Zeitverschiebung pflegen im Attribut *Offset_Manual_Timestamp* oder die Referenzbilder eintragen.  
Existiert bereits die Datei *data/[Eventname]-control.json*, dann werden die Werte nicht überschrieben. Also die Referenzbild Informationen oder der Offset bleibt erhalten.

### Analyse - Analyse der Dateien innerhalb der Kollektionen
```
npm run analyze
```
*Analyze* analysiert die Kollektionen und liest die Dateien ein gemäß Definition in der Datei *data/[Eventname]-control.json*.  
Das Ergebnis der Analyse wird in der Datei *data/[Eventname]-data.json* abgelegt.
Dort kann man nach der Analyse nach ***ERROR*** suchen, um die Problemfälle zu finden und evtl. zu bereinigen.  
Man kann auch manuell *DateTaken* und *ComputedTimestamp* pflegen und den *Status* auf "OK" setzen.

### Mix - PicMix erstellen aus den Kollektionen
```
npm run mix
```
Bei *Mix* werden die Dateien gemäß Datei *data/[Eventname]-data.json* in das Output Verzeichnis kopiert.
Je nach Konfiguration *Convert_Heic_to_JPG* werden die HEIC Dateien in JPG konvertiert. Dieser Vorgang dauert deutlich länger als eine reine Kopie.

## Technische Beschreibung der Attribute

#### Attribute *data/[Eventname]-control.json*

##### Header
| Attribut                       | Beschreibung
| ------------------------------ |-------------
| Name                           | Eventname
| Base_Directory                 | Haupverzeichnis, unter dem alle Kollektionen zu finden sind
| Output_Mix_Path                | Zielverzeichnis, in das alle Dateien umbenannt kopiert werden
| Output_Offset_Manual_Timestamp | Offset für alle Dateien, was am Ende berechnet wird. Hilfreich, wenn das Referenzbild des Masters die falsche Zeit hat.
| Convert_Heic_to_JPG            | true => Heic wird nicht kopiert, sondern konvertiert in JPG
| Copy_Error_Files               | true => Fehlerhafte Dateien werden mit Timestamp 0 kopiert / false => Fehlerhafte Dateien werden ignoriert
| Mix_Praefix                    | Präfix, welches vor alle Dateinamen vorangestellt wird
| Collections                    | Liste mit allen Kollektionen (Details im nächsten Kapitel)

##### Kollektion
| Attribut                         | Beschreibung
| -------------------------------- |-------------
| Name                             | Name der Kollektion
| Directory                        | Unterverzeichnis der Kollektion unter *Base_Diectory*
| Timestamp_Type                   | Zeitstemplel Typ - derzeit nicht verwendet
| Offset_Auto_Reference_Pic        | Referenzfoto oder Video, was zum gleichen Zeitpunkt gemacht wurde wie *Offset_Auto_Reference_Pic_Master*. Nur der Name der Datei ohne Pfadangabe.
| Offset_Auto_Reference_Pic_Master | Referenzfoto oder Video, was zum gleichen Zeitpunkt gemacht wurde wie *Offset_Auto_Reference_Pic*. Diese Datei wird mit dem entsprechenden Sub-Pfad (z.B.: ***./subpath/RefPic.jpg***) zu einer anderen Kollektion angegeben. Die ermittelte Differenz wird in das Attribut *Offset_Manual_Timestamp* eingetragen.
| Offset_Manual_Timestamp          | Manueller Offset für Datum und Zeit im Format: +/-YYYY:MM:TT HH:MM:SS

#### Attribute *data/[Eventname]-data.json*

##### Header pro Kollektion
| Attribut  | Beschreibung
| --------  |-------------
| Name      | Name der Kollektion
| Path      | Komplettes Verzeichnis zur Kollektion
| Files     | Liste von Dateien
| FileInfos | Liste von Dateiinfos (Details im nächsten Kapitel)

##### Datei Informationen pro Kollektion
| Attribut          | Beschreibung
| ----------------- |-------------
| UseDateTaken      | *true* Wenn dieser Wert *true* ist, dann wird bei der Analyse kein Zeitstempel *ComputedTimestamp* errechnet, sonder einfach *DateTaken* übernommen. Dadurch kann man manuell den Zeitstempel setzen.
| Status            | Status des Fotos/ Videos, ob ein Zeitstempel ermittelt werden konnte. Sollte hier ***Error*** auftauchen, dann sollte diese Datei geprüft werden, da sie nicht sinnvoll in die chronologische Reihenfolge eingefügt werden kann.
| Filename          | Kompletter Pfad zu dem Foto/ Video
| Found             | *[true/false]*, ob der Zeitstempel ermittelt werden konnte
| Format            | Format des Zeitstempels
| DateTaken         | Original Zeitstempel
| ComputedTimestamp | Zeitstempel, der bereits gemäß Zeitzonen und Offset umgerechnet wurde
| debug             | *true* Kann verwendet werden, um im Debugging schnell an das betreffende Objekt zu kommen

## Probleme
Die Scripte sollten nie parallel oder doppelt gestartet werden.
Es könnte zu einem ELIFECYCLE Error kommen.
Dann müssen evtl. die Dateien *config/appconfig.json*, *data/[Eventname]-data.json* und *data/[Eventname]-control.json* gelöscht werden. Am Besten in der genannten Reihenfolge nacheinander ausprobieren.
