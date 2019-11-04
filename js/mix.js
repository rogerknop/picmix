/*
plausis:
- path darf nicht leer sein
- offset_auto und offset_manual nicht beides gefüllt
- name eindeutig
- path existiert

*/

const mediainfo = require('node-mediainfo');
 
async function main() {
    var result1 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/VideoSonstige/VID_20170426_142717.mp4');
    console.log(result1.media.track[0].Format + " / " + result1.media.track[0].Encoded_Date + " / " + result1.media.track[0].Tagged_Date);
    var result2 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/Gopro-Video/GOPR6427.MP4');
    console.log(result2.media.track[0].Format + " / " + result2.media.track[0].Encoded_Date + " / " + result2.media.track[0].Tagged_Date);
    var result3 = await mediainfo('C:/Users/d022750/OneDrive/FotoMix/Bilder2/IMG_20170314_112207.jpg');
    console.log(result3.media.track[0].Format + " / " + result3.media.track[0].Encoded_Date + " / " + result3.media.track[0].Tagged_Date);
    console.log("ENDE");


    var ExifImage = require('exif').ExifImage;
 
    try {
        new ExifImage({ image : 'C:/Users/d022750/OneDrive/FotoMix/Bilder2/IMG_20170314_112207.jpg' }, function (error, exifData) {
            if (error)
                console.log('Error: '+error.message);
            else
                console.log(exifData); // Do something with your data!
        });
    } catch (error) {
        console.log('Error: ' + error.message);
    }    
}

main();