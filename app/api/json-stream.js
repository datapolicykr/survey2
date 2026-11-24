// Stream large read responses instead of buffering them at the function gateway.
// The JSON shape and values are identical for existing callers, including Admin.
export function streamedJson(data, request) {
 const json = JSON.stringify(data);
 const encoder = new TextEncoder();
 let offset = 0;
 let body = new ReadableStream({
  pull(controller) {
   if (offset >= json.length) { controller.close(); return; }
   let end = Math.min(offset + 32768, json.length);
   // Do not split a UTF-16 surrogate pair between independently encoded chunks.
   if (end < json.length && /[\uD800-\uDBFF]/.test(json[end - 1])) end--;
   controller.enqueue(encoder.encode(json.slice(offset, end)));
   offset = end;
  }
 });
 const headers = new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Accept-Encoding'});
 const gzip = (request?.headers.get('accept-encoding') || '').split(',').some(value => {
  const [name, ...options] = value.trim().toLowerCase().split(';');
  const quality = options.find(option => option.trim().startsWith('q='));
  return name === 'gzip' && (!quality || Number(quality.trim().slice(2)) > 0);
 });
 if (gzip) { body = body.pipeThrough(new CompressionStream('gzip')); headers.set('Content-Encoding','gzip'); }
 return new Response(body, {headers});
}
