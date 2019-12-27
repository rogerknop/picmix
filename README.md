# PicMix

## Setup / Installation
Hier die Schritte für die Installation. Der letzte git Befehl bewirkt, dass die lokalen Einstellungen nicht gepusht werden:
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
Bei Bedarf können einzelne Attribute in der Datei *data/[Eventname]-control.json* überschrieben werden.

### Timezones - Ermitteln der Zeitdifferenz (Offset) zu einem Ort 
```
npm run timezones
```
*Timezones* fragt nach einem Filter. Falls kein Filter angegeben wurde, werden alle Zeitzonen angezeigt.  
Die Zeitzone steht im Ergebnis in der Spalte "*Zeitzone*", die dann in der Datei *data/[Eventname]-control.json* für die jeweilige Kollektion im Attribut *Input_Timezone* gesetzt werden kann.

### Analyse - Analyse der Dateien innerhalb der Kollektionen
```
npm run analyze
```
*Analyze* analysiert die Kollektionen und liest die Dateien ein gemäß Definition in der Datei *data/[Eventname]-control.json*.  
Das Ergebnis der Analyse wird in der Datei *data/[Eventname]-data.json* abgelegt.
Dort kann man nach der Analyse nach ***ERROR*** suchen, um die Problemfälle zu finden und evtl. zu bereinigen.

### Mix - PicMix erstellen aus den Kollektionen
```
npm run mix
```
Bei *Mix* werden die Dateien gemäß Datei *data/[Eventname]-data.json* in das Output Verzeichnis kopiert.

## Technische Beschreibung der Attribute

#### Attribute *data/[Eventname]-control.json*

##### Header
| Attribut        | Beschreibung
| --------------- |-------------
| Name            | Eventname
| Base_Directory  | Haupverzeichnis, unter dem alle Kollektionen zu finden sind
| Output_Timezone | Zeitzone, die im Event für den Mix verwendet werden soll
| Output_Mix_Path | Zielverzeichnis, in das alle Dateien umbenannt kopiert werden
| Mix_Praefix     | Präfix, welches vor alle Dateinamen vorangestellt wird
| Collections     | Liste mit allen Kollektionen (Details im nächsten Kapitel)

##### Kollektion
| Attribut                         | Beschreibung
| -------------------------------- |-------------
| Name                             | Name der Kollektion
| Directory                        | Unterverzeichnis der Kollektion unter *Base_Diectory*
| Timestamp_Type                   | Zeitstemplel Typ ***ToDo***
| Input_Timezone                   | Name der Zeitzone, in der die Aufnahmen gemacht wurden (zum Ermitteln hilft `npm run timezones`). Dieser Wert wird als Default genommen, wenn innerhalb eines Fotos/ Videos dieser Kollektion keine Zeitzone manuell gesetzt wurde. Default ist die deutsche Zeitzone *Berlin UTC+1*
| Offset_Auto_Reference_Pic        | Referenzfoto, was zum gleichen Zeitpunkt gemacht wurde wie *Offset_Auto_Reference_Pic_Master*  ***ToDo***
| Offset_Auto_Reference_Pic_Master | Referenzfoto, was zum gleichen Zeitpunkt gemacht wurde wie *Offset_Auto_Reference_Pic*. Dieses Foto wird mit einem relatvem Pfad zu einer anderen Kollektion angegeben.  ***ToDo***
| Offset_Manual_Date               | Manueller Offset für das Datum im Format: +/-TT:MM:JJ
| Offset_Manual_Time               | Manueller Offset für die Zeit im Format: +/-HH:MM:SS

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
| Timezone          | Wenn hier manuell eine Zeitzone eingetragen wurde (zum Ermitteln hilft `npm run timezones`), dann wird in diese umgerechnet. Falls kein Wert, dann wird in die *Input_Timezone* verwendet für die Umrechnung in die *Ouput_Timezone*. 
| Found             | *[true/false]*, ob der Zeitstempel ermittelt werden konnte
| Format            | Format des Zeitstempels
| DateTaken         | Original Zeitstempel
| ComputedTimestamp | Zeitstempel, der bereits gemäß Zeitzonen und Offset umgerechnet wurde
| debug             | *true* Kann verwendet werden, um im Debugging schnell an das betreffende Objekt zu kommen
