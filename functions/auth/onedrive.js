import config from "../config/default";

export async function getAccessToken(context) {
    const timestamp = () => {
        return Math.floor(Date.now() / 1000)
    }

    let access = await context.env.CONFIG.get('od:access', {type: 'json'})
    // console.log(JSON.stringify(access))
    if (access && access.expire_at > timestamp() && access.access_token) {
        return access.access_token
    }

    const oneDriveAuthEndpoint = `${config.apiEndpoint.oauth}/token`

    const res = await fetch(oneDriveAuthEndpoint, {
        method: 'POST',
        body: `client_id=${context.env.CLIENT_ID}&redirect_uri=${context.env.REDIRECT_URI}&client_secret=${context.env.CLIENT_SECRET}&refresh_token=${access.refresh_token}&grant_type=refresh_token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

    if (res.ok) {
        access = await res.json()
        access.expire_at = timestamp() + access.expires_in
        await context.env.CONFIG.put('od:access', JSON.stringify(access))
        return access.access_token
    } else {
        throw `getAccessToken error ${JSON.stringify(await res.text())}`
    }
}