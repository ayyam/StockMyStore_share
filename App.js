import React, {useRef, useState, useCallback, useEffect} from 'react';
import {BackHandler, PermissionsAndroid, Platform} from 'react-native';
import {WebView} from 'react-native-webview';
import RNFetchBlob from 'rn-fetch-blob';
import * as axios from 'axios';
import Share from 'react-native-share';

export default function App() {
  const webView = useRef();

  const [canGoBack, setCanGoBack] = useState(false);

  const [isLoading, setLoading] = useState(true);
  let [data, setData] = useState([]);

  var base64 = require('base-64');
  const uname = 'ck_f8e6f9231f5dac1b5f6ce0ff28349b77230757ee';
  const pword = 'cs_51598b3d7c9ce359e0ed95fd0139e4aaa3097dd7';

  const handleBack = useCallback(() => {
    if (canGoBack && webView.current) {
      webView.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  // check file permission code start

  const checkPermission = async () => {
    // Function to check the platform
    // If iOS then start downloading
    // If Android then ask for permission

    if (Platform.OS === 'ios') {
      return true;
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download Photos',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Once user grant the permission start downloading
          console.log('Storage Permission Granted.');
          return true;
        } else {
          // If permission denied then show alert
          console.log('Storage Permission Not Granted');
        }
      } catch (err) {
        // To handle permission related exception
        console.warn(err);
      }
    }
  };

  // check file permission code end
  const getExtention = filename => {
    // To get the file extension
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename) : undefined;
  };

  var Base64 = [];
  let arrayImages;

  //share button click function start
  function onMessage(data) {
    //console.log(data, 'element');
    // alert(data.nativeEvent.data);

    console.log(data.nativeEvent.title);
    let productTitle = data.nativeEvent.title;
    console.log(data.nativeEvent.data);
    let shortProductTitle = productTitle.substr(0, productTitle.indexOf('–'));

    console.log(shortProductTitle);
    var check = checkPermission();
    // axios get product  code starts
    if (check) {
      axios
        .get(
          `https://stockmystores.com/wp-json/wc/v3/products?search=` +
            shortProductTitle +
            ``,
          {
            headers: {
              Authorization: 'Basic ' + base64.encode(uname + ':' + pword),
            },
          },
        )
        .then(function (response) {
          setLoading(false);

          //get images in array , download mutiple images and convert to base 64
          arrayImages = response.data[0].images;
          let dummy = arrayImages.map(dummyImage => {
            return dummyImage.src;
          });
          arrayImages.map(imagesrc => {
            // Main function to download the image

            // To add the time suffix in filename
            let date = new Date();
            // Image URL which we want to download
            let image_URL = imagesrc.src;
            // Getting the extention of the file
            let ext = getExtention(image_URL);
            ext = '.' + ext[0];
            // Get config and fs from RNFetchBlob
            // config: To pass the downloading related options
            // fs: Directory path where we want our image to download
            const {config, fs} = RNFetchBlob;
            let PictureDir = fs.dirs.PictureDir;
            let options = {
              fileCache: true,
              addAndroidDownloads: {
                // Related to the Android only
                useDownloadManager: true,
                notification: true,
                path:
                  PictureDir +
                  '/image_' +
                  Math.floor(date.getTime() + date.getSeconds() / 2) +
                  ext,
                description: 'Image',
              },
            };
            config(options)
              .fetch('GET', image_URL)
              .then(res => {
                // Showing alert after successful downloading
                image_URL = res.path();

                return res.readFile('base64');
              })
              .then(img => {
                // here base64 encoded file data is returned
                let im = `data:image/jpeg;base64,${img}`;
                Base64.push(im);
                setData(im);
                //return im;

                if (Base64.length === dummy.length) {
                  nextnew(Base64);
                }
                // return fs.unlink(image_URL);
              });
          });
        })
        .catch(error => {
          setLoading(false);
        });
    }

    //get images in array , download mutiple images and convert to base 64
    // axios get products code ends
  }
  const nextnew = d => {
    let shareImage = {
      title: 'Share Images',

      urls: d,
      subject: 'Image',
    };
    Share.open(shareImage)
      .then(res => {
        console.log(res);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBack);
    };
  }, [handleBack]);

  return (
    <WebView
      ref={webView}
      allowFileAccess={true}
      source={{uri: 'https://stockmystores.com/'}}
      onLoadProgress={event => setCanGoBack(event.nativeEvent.canGoBack)}
      scalesPageToFit={false}
      mixedContentMode="compatibility"
      onMessage={onMessage}
      injectedJavaScript={
        'document.getElementById("webbutton").removeAttribute("href");'
      }
      javaScriptEnabled={true} // ---> don't forget this
    />
  );
}
