import fetch from 'node-fetch';
import random from 'randomstring';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const BASE_PREFIX = Buffer.from('aHR0cHM6Ly9kZWVwbnVkZS50bw==', 'base64').toString('utf-8');
const TOKLEN_SESSIONID = 32;
const TOKLEN_IMGID = 15;

class UrlPrefixes {
    constructor() {
        this.status = '/api/status/';
        this.upload_request = '/api/request-upload/';
        this.image_upload = '/upload/';
        this.get_im_prefix = '/img/';
        this.get_im_suffix = '/watermark.jpg';
    }
}

function generateRandomToken(toklen) {
    return random.generate({
        length: toklen,
        charset: 'abcdefghijklmnopqrstuvwxyz0123456789'
    });
}

async function checkPing() {
    try {
        const response = await fetch(BASE_PREFIX + new UrlPrefixes().status, {
            timeout: 30000
        });
        return response.status;
    } catch (error) {
        return 408;
    }
}

async function getUploadPermission(imageId, cookie) {
    const headers = {
        'Host': BASE_PREFIX.split('/')[2],
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': BASE_PREFIX,
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': BASE_PREFIX,
        'Cookie': `userid=${cookie}; identifier=${cookie}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'Trailers',
    };
    const url = BASE_PREFIX + new UrlPrefixes().upload_request + imageId;
    const response = await fetch(url, {
        method: 'POST',
        headers: headers
    });
    return await response.text();
}

async function uploadImage(imageId, cookie, filename) {
    const data = fs.readFileSync(filename);
    const headers = {
        'Host': BASE_PREFIX.split('/')[2],
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'image/jpeg',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Length': `${data.length - 3}`,
        'Origin': BASE_PREFIX,
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': BASE_PREFIX,
        'Cookie': `userid=${cookie}; identifier=${cookie}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'Trailers',
    };
    const url = BASE_PREFIX + new UrlPrefixes().image_upload + imageId;
    const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: data
    });
    return response.status;
}

async function getImage(imageId, cookie) {
    await new Promise(resolve => setTimeout(resolve, 20000));
    const headers = {
        'Host': BASE_PREFIX.split('/')[2],
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0',
        'Accept': 'image/webp,*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': BASE_PREFIX,
        'Cookie': `userid=${cookie}; identifier=${cookie}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'Trailers',
    };
    const url = BASE_PREFIX + new UrlPrefixes().get_im_prefix + imageId + new UrlPrefixes().get_im_suffix;
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    });
    return {
        status: response.status,
        content: await response.buffer()
    };
}
async function main() {
    const imageId = await generateRandomToken(TOKLEN_IMGID);
    const cookie = await generateRandomToken(TOKLEN_SESSIONID);
    const filename = 'image.jpg';

    const pingStatus = await checkPing();
    console.log('Ping Status:', pingStatus);

    const uploadPermission = await getUploadPermission(imageId, cookie);
    console.log('Upload Permission:', uploadPermission);

    const uploadStatus = await uploadImage(imageId, cookie, filename);
    console.log('Upload Status:', uploadStatus);

    const imageInfo = await getImage(imageId, cookie);
    console.log('Image Status:', imageInfo.status);

    if (imageInfo.status === 200) {
        const uuidFilename = uuidv4() + '.jpg'; // Generate a random UUID filename with '.jpg' extension
        fs.writeFileSync(uuidFilename, imageInfo.content);
        console.log('Image saved as:', uuidFilename);
    }
}

main();
