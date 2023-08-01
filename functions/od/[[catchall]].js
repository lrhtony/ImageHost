export function onRequest(context) {
    let res = {}
    res['params'] = context.params.catchall

    res['functionPath'] = context.functionPath

    res['headers'] = {}
    for (const [key, value] of context.request.headers.entries()) {
        res['headers'][key] = value
    }

    res['method'] = context.request.method

    res['url'] = context.request.url

    const params = new URL(context.request.url).searchParams
    res['query'] = {}
    for (const [key, value] of params.entries()) {
        res['query'][key] = value
    }

    return new Response(JSON.stringify(res))
}