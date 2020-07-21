// This file provides a system to load arbitrary assets
// and convert them to usable objects, depending on the
// loader associated with assets.
// If you want to add something specific to the game, prefer doing so in js/assets.js

export {
    load_assets,
    dummy_loader,
    image_loader,
    audio_loader,
}

// Takes an object that looks like this:
//
// asset_desc {
//   images: { // Name of the type of asset, and also name of the group of assets.
//     asset_loader: load_images, // Function that will be used to produce the asset.
//                                // In this example, let's assume that load_images will create "img" elements.
//     image_a : "./img/image_a.png", // Key is the name of the object that will be generated,
//     image_b : "./img/image_b.png", // the value is the path to the file to use for the asset.
//    },
//    audio: { /* ... */ }, // This one will create "audio" elements,
//    /* ... */                   // etc.
// };
//
// Then the asset can be retrieved through the variables of the name
// of the assets:
//
// import * as assets from ""./assets.js";
// let my_assets = await assets.load_asset(asset_desc);
// let sprite = new Sprite( my_assets.images.image_a );
//
// Each loader function must be of the form (and return the same structure):
//   function loader(group_name, name, path) {
// And it must return a Promise with a result value object looking like this:
//    {
//      "group_name": { // must have the name of the group of assets
//       "asset_name": new Asset()  // name of asset : the loaded asset
//      }
//    };
//
//
function load_assets(assets_desc) {
    console.assert(assets_desc);
    console.log("Loading assets...");
    let promises = [];
    const loader_name = "asset_loader";
    // We launch the loadings in "parallel" (as parallel as JS can do...)
    for (let asset_group_name in assets_desc) {
        let asset_group = assets_desc[asset_group_name];
        let loader = asset_group[loader_name];
        console.assert(loader);

        for (let asset_name in asset_group) {
            if (asset_name == loader_name) // skip the loader function
                continue;
            let promise = loader(asset_group_name, asset_name, asset_group[asset_name]);
            console.assert(promise);
            console.assert(promise instanceof Promise);
            promises.push(promise);
        }
    }

    return Promise.all(promises) // Wait for all the loadings to be done.
        .then((all_loaded_assets) => { // We managed to load all the assets.
            // Merge all resulting objects together to form one object.
            let all_assets = {};
            all_loaded_assets.forEach(asset => {
                // console.log(`Asset: ${JSON.stringify(asset)}`);
                for (const asset_group_name in asset) {
                    let asset_data = asset[asset_group_name];
                    if (!all_assets[asset_group_name])
                        all_assets[asset_group_name] = {};
                    all_assets[asset_group_name] = { ...all_assets[asset_group_name], ...asset_data };
                }
            });
            console.log("Loading assets - DONE");
            return all_assets;
        }, (reason) => { // if there is any error
            throw "Failed to load assets: " + reason;
        });
}

function dummy_loader(group_name, name, path) {
    return new Promise((resolve) => {
        //console.log( `dummy loading: ${name} => ${path}` );
        let result = {};
        result[group_name] = {};
        result[group_name][name] = { source: path };
        resolve(result);
    });
}

function image_loader(group_name, name, path) {
    return new Promise((resolve) => {
        //console.log( `image loading: ${name} => ${path} ...` );
        let img = document.createElement("img");
        let result = {};
        result[group_name] = {};
        result[group_name][name] = img;
        img.onload = () => {
            //console.log( `image loading: ${name} => ${path} - DONE` );
            resolve(result);
        };
        img.src = path; // Starts the loading.
    });
}

function audio_loader(group_name, name, path) {
    const audio_context = new AudioContext();
    return new Promise((resolve) => {
        //console.log( `image loading: ${name} => ${path} ...` );
        let request = new XMLHttpRequest();
        let result = {};
        result[group_name] = {};

        request.open('GET', path);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            // console.log(`audio loading: ${name} => ${path} - DONE`);
            audio_context.decodeAudioData(request.response,
                (buffer) => { 
                    result[group_name][name] = buffer;
                    resolve(result);
                },
                () => { console.log('buffer decode failed') });
        };
        request.send()
    });
}

