/*

- npm cli-progress

Threads - Worker
- npm worker_threads - node V12 ist notwendig! Oder mit parameter starten
    https://www.heise.de/developer/artikel/Features-von-uebermorgen-Worker-Threads-in-Node-js-4354189.html
    https://nodesource.com/blog/worker-threads-nodejs/

plausis:
- path darf nicht leer sein
- offset_auto und offset_manual nicht beides gefüllt
- name eindeutig
- path existiert

Erst manuell Offset berechnen, dann über RefPic

*/

const Globals = require('./globals');
const Collection = require('./collection');
const FileInfo = require('./fileinfo');
const mediainfo = require('node-mediainfo');



async function main() {
    var collection = new Collection('C:/Users/d022750/OneDrive/FotoMix');
    
    collection = await collection.readCollection();
    
    var files = await collection.getFiles();
    

    /*
    var result1 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/VideoSonstige/VID_20170426_142717.mp4');
    debug(result1.media.track[0].Format, result1.media.track[0].Encoded_Date)
    var result2 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/Gopro-Video/GOPR6427.MP4');
    debug(result2.media.track[0].Format, result2.media.track[0].Encoded_Date)
    var result3 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/Bilder2/IMG_20170314_112207.jpg');
    debug(result3.media.track[0].Format, result3.media.track[0].Encoded_Date)
    var result4 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/cam-foto/Magic_2019_10_10 08_30_58_013.JPG');
    debug(result4.media.track[0].Format, result4.media.track[0].Encoded_Date)
    var result5 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/cam-video/Magic_2019_10_10 15_04_53_002.MTS');
    debug(result5.media.track[0].Format, result5.media.track[0].Recorded_Date)
    var result6 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/cam-rad/Magic_2019_10_11 10_21_50_003.MP4');
    debug(result6.media.track[0].Format, result6.media.track[0].Encoded_Date)
    */
   
   /*
   var fileInfo;
   fileInfo = await FileInfo.getFileInfo('C:/Users/d022750/OneDrive/FotoMix/VideoSonstige/VID_20170426_142717.mp4');
   FileInfo.debugInfos(fileInfo);
   fileInfo = await FileInfo.getFileInfo('C:/Users/d022750/OneDrive/FotoMix/Bilder2/IMG_20170314_112207.jpg');
   FileInfo.debugInfos(fileInfo);
   fileInfo = await FileInfo.getFileInfo('C:/Users/d022750/OneDrive/FotoMix/cam-foto/Magic_2019_10_10 08_30_58_013.JPG');
   FileInfo.debugInfos(fileInfo);
   fileInfo = await FileInfo.getFileInfo('C:/Users/d022750/OneDrive/FotoMix/cam-video/Magic_2019_10_10 15_04_53_002.MTS');
   FileInfo.debugInfos(fileInfo);
   */
   
   
    //var exifData = await getExif();
    //console.log("Exif Data: " + exifData)
}

main();

