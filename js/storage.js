

// This file is designed to not crash if access to window.localstorage is not allowed.



class LocalStorage {

    getItem(name){
        return window.localStorage.getItem(name);
    }

    setItem(name, item){
        return window.localStorage.setItem(name, item);
    }

    removeItem(name){
        return window.localStorage.removeItem(name);
    }

};

class TemporaryStorage {

    storage = {};

    getItem(name){
        try{
            const item_str = storage[name];
            if(typeof item_str === 'string'){
                return JSON.parse(item_str);
            }
        } catch(error) {
            console.warn(`failed to get value in storage: ${error}`);
        }
    }

    setItem(name, item){
        try{
            const item_str = JSON.stringify(item);
            storage[name] = item_str;
        } catch(error){
            console.warn(`failed to set value in storage: ${error}`);
        }

    }

    removeItem(name){
        delete storage[name];
    }

};

function is_local_storage_available() {
    try {
        window.localStorage.setItem("check", { something: "ok" });
        window.localStorage.removeItem("check");
        return true;
    } catch(error) {
        return false;
    }
}

export const is_localstorage_allowed = is_local_storage_available();
export const storage = is_localstorage_allowed ? new LocalStorage() : new TemporaryStorage();
