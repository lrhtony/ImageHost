import {getAccessToken} from "../auth/onedrive";
import config from "../config/default";

export async function onRequest(context) {
    const access_token = await getAccessToken(context)
    if (!/^[a-zA-Z0-9]{34}$/.test(context.params.catchall[0])) {
        return new Response(JSON.stringify({
            error: {
                code: 'invalidRequest',
                message: 'Invalid request'
            }
        }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=259200, immutable'
            }
        })
    }
    const res = await fetch(`${config.apiEndpoint.graph}/me/drive/items/${context.params.catchall[0]}/content`, {
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'User-Agent': 'ImageHost(@lrhtony)/1.1'
        },
        redirect: 'follow'
    })

    if (res.ok) {
        let content_length = res.headers.get('Content-Length')
        let content_disposition = res.headers.get('Content-Disposition');
        let content_type = res.headers.get('Content-Type');

        const extensionMatch = content_disposition.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)/i);
        if (extensionMatch) {
            content_disposition = content_disposition.replace('attachment', 'inline');
            if (content_type === 'application/octet-stream') {
                content_type = 'image/' + extensionMatch[1];
            }
        }

        if (content_length < 1024 * 1024 * 5) {
            return new Response(res.body, {
                headers: {
                    'Content-Disposition': content_disposition,
                    'Content-Length': content_length,
                    'Content-Type': content_type,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }
        else {
            const { readable, writable } = new TransformStream({
                transform(chunk, controller) {
                    controller.enqueue(chunk);
                },
            });
            res.body.pipeTo(writable);
            return new Response(readable, {
                headers: {
                    'Content-Disposition': content_disposition,
                    'Content-Type': content_type,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }

    }
    else {
        if (res.status === 404) {
            return new Response(JSON.stringify({
                error: {
                    code: 'itemNotFound',
                    message: 'The resource could not be found.'
                }
            }), {
                status: res.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=259200, immutable'
                }
            })
        }
        else {
            return new Response(readable, {
                status: res.status,
                headers: {
                    'Content-Type': res.headers.get('Content-Type'),
                    'Cache-Control': 'public, max-age=86400, immutable'
                }
            })
        }
    }
}