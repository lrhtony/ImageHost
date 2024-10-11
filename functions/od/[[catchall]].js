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
        },
        redirect: 'follow'
    })
    if (res.ok) {
        return new Response(res.body, {
            headers: {
                'Content-Disposition': res.headers.get('Content-Disposition'),
                'Content-Length': res.headers.get('Content-Length'),
                'Content-Type': res.headers.get('Content-Type'),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*'
            }
        })
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
            return new Response(res.body, {
                status: res.status,
                headers: {
                    'Content-Type': res.headers.get('Content-Type'),
                    'Cache-Control': 'public, max-age=86400, immutable'
                }
            })
        }
    }
}