import { sha256 } from '../js/sha256.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  // 地區限制：只允許來自日本（JP）訪問
  const country = request.headers.get("cf-ipcountry");
  if (country !== "JP") {
    // return new Response("Access denied: region blocked", { status: 403 });
    // return new Response("Not found", { status: 404 });
    return new Response(`
      <html>
        <head><title>Site can't be reached</title></head>
        <body>
          <h1>This site can't be reached</h1>
          <p>The webpage at <code>${request.url}</code> might be temporarily down or it may have moved permanently to a new web address.</p>
          <p>ERR_TUNNEL_CONNECTION_FAILED</p>
        </body>
      </html>
      `, {
          status: 404,
          headers: {
            "content-type": "text/html"
          }
      }
    );
  }
  
  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("text/html")) {
    let html = await response.text();
    
    // 处理普通密码
    const password = env.PASSWORD || "";
    let passwordHash = "";
    if (password) {
      passwordHash = await sha256(password);
    }
    html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
      `window.__ENV__.PASSWORD = "${passwordHash}";`);

    // 处理管理员密码 - 确保这部分代码被执行
    const adminPassword = env.ADMINPASSWORD || "";
    let adminPasswordHash = "";
    if (adminPassword) {
      adminPasswordHash = await sha256(adminPassword);
    }
    html = html.replace('window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";',
      `window.__ENV__.ADMINPASSWORD = "${adminPasswordHash}";`);
    
    return new Response(html, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  
  return response;
}
