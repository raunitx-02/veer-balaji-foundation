import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { storage } from "../firebase";

/* ------------------------------------------
   Helper: wrap any promise with a timeout
------------------------------------------- */
function withTimeout(promise, ms = 15000, fallback = null) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            console.warn(`storageService: upload timed out after ${ms}ms, using fallback`);
            resolve(fallback);
        }, ms);
        promise
            .then((result) => { clearTimeout(timer); resolve(result); })
            .catch((err) => {
                clearTimeout(timer);
                console.warn('storageService: upload error, using fallback:', err?.message);
                resolve(fallback);
            });
    });
}

/* ------------------------------------------
   1. Upload file and return download URL
------------------------------------------- */
export async function uploadFile(folderName, file) {
    if (!file) return { url: '', path: '' };
    const rawFile = file.originFileObj || file;
    if (!rawFile || typeof rawFile !== 'object') return { url: file?.url || '', path: '' };
    const fileName = file.name || rawFile.name || `${Date.now()}`;
    const cleanFolder = (folderName || 'uploads').replace(/^\/+|\/+$/g, '');
    const fileRef = ref(storage, `${cleanFolder}/${Date.now()}_${fileName}`);

    const uploadPromise = uploadBytes(fileRef, rawFile)
        .then(() => getDownloadURL(fileRef))
        .then(url => ({ url, path: fileRef.fullPath }));

    const result = await withTimeout(uploadPromise, 15000, { url: file?.url || '', path: fileRef.fullPath, timedOut: true });
    return result;
}

/* ------------------------------------------
   2. Upload file with progress callback
------------------------------------------- */
export function uploadFileWithProgress(folderName, file, progressCallback) {
    const rawFile = file.originFileObj || file;
    const fileName = file.name || rawFile.name || `${Date.now()}`;
    const fileRef = ref(storage, `${folderName}/${Date.now()}_${fileName}`);

    const uploadTask = uploadBytesResumable(fileRef, rawFile);

    uploadTask.on("state_changed", (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressCallback(progress.toFixed(0));
    });

    const uploadPromise = new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            null,
            reject,
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                    url,
                    path: uploadTask.snapshot.ref.fullPath,
                });
            }
        );
    });

    return withTimeout(uploadPromise, 20000, { url: '', path: fileRef.fullPath, timedOut: true });
}

/* ------------------------------------------
   3. Upload multiple files
------------------------------------------- */
export async function uploadMultiple(folderName, files) {
    const results = [];

    for (const file of files) {
        const uploaded = await uploadFile(folderName, file);
        results.push(uploaded);
    }

    return results;
}

/* ------------------------------------------
   4. Delete file by path
------------------------------------------- */
export async function deleteFile(path) {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
}
