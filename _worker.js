// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let ADMIN_PASS = 'your_password_here'; // 新增：访问配置面板的密钥，请务必修改！
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net";
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini";
let subProtocol = 'https';
let linkSub = '';
let warp = '';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');

		// 从 KV 加载变量，优先 KV > env > 默认
		if (env.KV) {
			mytoken = await env.KV.get('TOKEN') || env.TOKEN || mytoken;
			ADMIN_PASS = await env.KV.get('ADMIN_PASS') || env.ADMIN_PASS || ADMIN_PASS;
			BotToken = await env.KV.get('TGTOKEN') || env.TGTOKEN || BotToken;
			ChatID = await env.KV.get('TGID') || env.TGID || ChatID;
			TG = parseInt(await env.KV.get('TG') || env.TG || TG);
			FileName = await env.KV.get('SUBNAME') || env.SUBNAME || FileName;
			SUBUpdateTime = parseInt(await env.KV.get('SUBUPTIME') || env.SUBUPTIME || SUBUpdateTime);
			total = parseFloat(await env.KV.get('TOTAL') || env.TOTAL || total);
			timestamp = parseInt(await env.KV.get('TIMESTAMP') || env.TIMESTAMP || timestamp);
			subConverter = await env.KV.get('SUBAPI') || env.SUBAPI || subConverter;
			subConfig = await env.KV.get('SUBCONFIG') || env.SUBCONFIG || subConfig;
			linkSub = await env.KV.get('LINKSUB') || env.LINKSUB || '';
			warp = await env.KV.get('WARP') || env.WARP || '';
		} else {
			mytoken = env.TOKEN || mytoken;
			ADMIN_PASS = env.ADMIN_PASS || ADMIN_PASS;
			BotToken = env.TGTOKEN || BotToken;
			ChatID = env.TGID || ChatID;
			TG = env.TG || TG;
			FileName = env.SUBNAME || FileName;
			SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;
			total = env.TOTAL || total;
			timestamp = env.TIMESTAMP || timestamp;
			subConverter = env.SUBAPI || subConverter;
			subConfig = env.SUBCONFIG || subConfig;
			linkSub = env.LINKSUB || '';
			warp = env.WARP || '';
		}

		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);

		// 验证 ADMIN_PASS（访问配置面板时必须提供正确密钥）
		const passParam = url.searchParams.get('pass');
		const isAuthorized = passParam === ADMIN_PASS || url.pathname.endsWith(`/${ADMIN_PASS}`);

		if (!([mytoken, fakeToken].includes(token) || url.pathname === "/" + mytoken || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
		} else {
			if (env.KV) await 迁移地址列表(env, 'LINK.txt');

			// 浏览器访问且未提供正确 pass → 显示伪装页面
			if (userAgent.includes('mozilla') && !url.search && !isAuthorized) {
				await sendMessage(`#尝试访问面板（无密钥） ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}`);
				return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
			}

			// 授权通过 → 显示配置面板
			if (userAgent.includes('mozilla') && !url.search) {
				await sendMessage(`#访问订阅面板 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}`);
				return await KV(request, env, 'LINK.txt');
			}

			// 其余为订阅请求
			if (env.KV) {
				MainData = await env.KV.get('LINK.txt') || MainData;
			} else {
				MainData = env.LINK || MainData;
				if (linkSub) urls = await ADD(linkSub);
			}

			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) 订阅链接 += x + '\n';
				else 自建节点 += x + '\n';
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);

			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}`);

			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) 订阅格式 = 'singbox';
				else if (userAgent.includes('surge') || url.searchParams.has('surge')) 订阅格式 = 'surge';
				else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) 订阅格式 = 'quanx';
				else if (userAgent.includes('loon') || url.searchParams.has('loon')) 订阅格式 = 'loon';
				else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) 订阅格式 = 'clash';
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.());
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)' } });
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							req_data += '\n' + atob(subConverterContent);
						}
					} catch (error) {}
				}
			}

			if (warp) 订阅转换URL += "|" + (await ADD(warp)).join("|");

			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);
			const uniqueLines = new Set(text.split('\n'));
			const result = [...uniqueLines].join('\n');

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;
						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}
					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}
				base64Data = encodeBase64(result);
			}

			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			} else if (订阅格式 == 'clash') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'singbox') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'surge') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'quanx') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			} else if (订阅格式 == 'loon') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
			}

			try {
				const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
				if (!subConverterResponse.ok) return new Response(base64Data, { headers: responseHeaders });
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

// 以下函数保持不变（ADD, nginx, sendMessage, base64Decode, MD5MD5, clashFix, proxyURL, getSUB, getUrl, isValidBase64, 迁移地址列表）

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, -1);
	return addtext.split('\n');
}

async function nginx() {
	return `<!DOCTYPE html><html><head><title>Welcome to nginx!</title><style>body{width:35em;margin:0 auto;font-family:Tahoma,Verdana,Arial,sans-serif;}</style></head><body><h1>Welcome to nginx!</h1><p>If you see this page, the nginx web server is successfully installed and working. Further configuration is required.</p><p>For online documentation and support please refer to <a href="http://nginx.org/">nginx.org</a>.<br/>Commercial support is available at <a href="http://nginx.com/">nginx.com</a>.</p><p><em>Thank you for using nginx.</em></p></body></html>`;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}
		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, { method: 'get', headers: { 'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72' } });
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	return new TextDecoder('utf-8').decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();
	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstHex = Array.from(new Uint8Array(firstPass)).map(b => b.toString(16).padStart(2, '0')).join('');
	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	return Array.from(new Uint8Array(secondPass)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines = content.includes('\r\n') ? content.split('\r\n') : content.split('\n');
		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				result += line.replace(/, mtu: 1280, udp: true/g, ', mtu: 1280, remote-dns-resolve: true, udp: true') + '\n';
			} else {
				result += line + '\n';
			}
		}
		return result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];
	let parsedURL = new URL(fullURL);
	let newURL = `${parsedURL.protocol}//${parsedURL.hostname}${parsedURL.pathname.replace(/\/$/, '')}${url.pathname}${parsedURL.search}`;
	let response = await fetch(newURL);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) return [];
	api = [...new Set(api)];
	let newapi = "", 订阅转换URLs = "", 异常订阅 = "";
	const timeout = setTimeout(() => {}, 2000); // 简化
	try {
		const responses = await Promise.allSettled(api.map(url => getUrl(request, url, 追加UA, userAgentHeader).then(r => r.ok ? r.text() : Promise.reject(r))));
		for (let i = 0; i < responses.length; i++) {
			if (responses[i].status === 'fulfilled') {
				const content = responses[i].value;
				if (content.includes('proxies:')) 订阅转换URLs += "|" + api[i];
				else if (content.includes('outbounds"') && content.includes('inbounds"')) 订阅转换URLs += "|" + api[i];
				else if (content.includes('://')) newapi += content + '\n';
				else if (/^[A-Za-z0-9+/=]+$/.test(content.trim())) newapi += base64Decode(content) + '\n';
				else 异常订阅 += `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85 ${api[i].split('://')[1]?.split('/')[0]}\n`;
			}
		}
	} catch (e) {}
	clearTimeout(timeout);
	return [await ADD(newapi + 异常订阅), 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);
	return fetch(new Request(targetUrl, { method: request.method, headers: newHeaders, body: request.body, redirect: "follow", cf: { insecureSkipVerify: true } }));
}

function isValidBase64(str) { return /^[A-Za-z0-9+/=]+$/.test(str.replace(/\s/g, '')); }

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	if (旧数据 && !(await env.KV.get(txt))) {
		await env.KV.put(txt, 旧数据);
		await env.KV.delete(`/${txt}`);
	}
}

// ==================== 配置面板 ====================
async function KV(request, env, txt = 'LINK.txt') {
	const url = new URL(request.url);
	try {
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			const body = await request.text();
			try {
				const data = JSON.parse(body);
				for (let [key, val] of Object.entries(data)) await env.KV.put(key, val);
				return new Response("更新成功");
			} catch (e) {
				await env.KV.put(txt, body);
				return new Response("保存成功");
			}
		}

		let content = '';
		let hasKV = !!env.KV;
		if (hasKV) content = await env.KV.get(txt) || '';

		const baseUrl = `https://${url.hostname}`;
		const ownerBase = `${baseUrl}/${mytoken}`;

		const subs = [
			{ name: "自适应订阅", link: ownerBase },
			{ name: "Base64订阅",   link: `${ownerBase}?b64` },
			{ name: "Clash订阅",    link: `${ownerBase}?clash` },
			{ name: "Sing-Box订阅", link: `${ownerBase}?sb` },
			{ name: "Surge订阅",    link: `${ownerBase}?surge` },
			{ name: "Loon订阅",     link: `${ownerBase}?loon` }
		];

		const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${FileName} 订阅管理</title>
    <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;background:#f6f8fa;color:#333;margin:0;padding:20px;line-height:1.6;}
        .container{max-width:1100px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;}
        header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;}
        header h1{margin:0;font-size:28px;} header p{margin:10px 0 0;opacity:0.9;font-size:16px;}
        .section{padding:30px;border-bottom:1px solid #eee;}
        .section:last-child{border-bottom:none;}
        h2{font-size:20px;margin:0 0 20px;color:#444;border-bottom:2px solid #667eea;padding-bottom:8px;}

        .sub-area{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start;}
        .sub-card{background:#f9f9f9;border-radius:12px;padding:25px;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.08);}
        .sub-card h3{margin:0 0 15px;font-size:18px;color:#555;}
        .sub-link{display:block;margin:15px 0 20px;color:#667eea;font-size:15px;word-break:break-all;}
        .qrcode{margin:0 auto;width:220px;height:220px;}

        .sub-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:20px;}
        .sub-btn{background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;padding:18px;font-size:16px;cursor:pointer;transition:.3s;box-shadow:0 4px 15px rgba(102,126,234,0.4);}
        .sub-btn:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(102,126,234,0.6);}
        .sub-btn.active{background:linear-gradient(135deg,#764ba2,#667eea);box-shadow:0 6px 20px rgba(118,75,162,0.5);}

        .toggle-btn{background:none;border:none;color:#667eea;font-size:16px;cursor:pointer;margin-bottom:15px;}
        .toggle-btn:hover{text-decoration:underline;}
        .hidden{display:none;}

        textarea.editor{width:100%;height:420px;padding:15px;border:1px solid #ddd;border-radius:8px;font-family:'Courier New',monospace;font-size:14px;box-sizing:border-box;margin-bottom:15px;}
        .save-btn{background:#667eea;color:white;border:none;padding:12px 28px;border-radius:8px;cursor:pointer;font-size:16px;transition:.3s;}
        .save-btn:hover{background:#5a6fd8;}
        footer{text-align:center;padding:20px;font-size:14px;color:#888;background:#f9f9f9;}
        @media(max-width:768px){.sub-area{grid-template-columns:1fr;}.sub-buttons{grid-template-columns:repeat(2,1fr);}}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>${FileName} 订阅管理</h1>
            <p>点击下方按钮切换订阅格式并复制链接</p>
        </header>

        <div class="section">
            <h2>主人订阅链接</h2>
            <div class="sub-area">
                <div class="sub-card">
                    <h3>订阅链接 & 二维码</h3>
                    <a class="sub-link" id="sub-link">${subs[0].link}</a>
                    <div id="qrcode" class="qrcode"></div>
                </div>
                <div class="sub-card">
                    <h3>选择订阅格式</h3>
                    <div class="sub-buttons">
                        ${subs.map((sub, i) => `
                        <button class="sub-btn ${i===0?'active':''}" data-index="${i}">${sub.name}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>配置订阅转换及变量</h2>
            <button class="toggle-btn" id="configToggle" onclick="toggleConfig()">展开配置 ↓</button>
            <div id="configSection" class="hidden">
                <div style="margin-bottom:30px;">
                    <label>SUBAPI（订阅转换后端）：</label>
                    <input id="SUBAPI" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;" value="${subConverter}" />
                    <label style="display:block;margin-top:15px;">SUBCONFIG（配置文件）：</label>
                    <input id="SUBCONFIG" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;" value="${subConfig}" />
                    <div style="margin-top:15px;">
                        <button class="save-btn" onclick="updateSubConfig(this)">更新订阅转换配置</button>
                        <span id="subConfigStatus" style="margin-left:15px;"></span>
                    </div>
                </div>

                <div>
                    <strong style="display:block;margin-bottom:15px;">变量配置</strong>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
                        <div>
                            <label>TOKEN（访问路径令牌）</label>
                            <input class="var-input" id="TOKEN" value="${mytoken}" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                        </div>
                        <div>
                            <label>ADMIN_PASS（面板访问密钥）<strong style="color:red;">*</strong></label>
                            <input class="var-input" id="ADMIN_PASS" value="${ADMIN_PASS}" type="password" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                            <small style="color:#888;">访问方式：/?pass=你的密钥 或 /你的密钥</small>
                        </div>
                        <div>
                            <label>TGTOKEN（Telegram Bot Token）</label>
                            <input class="var-input" id="TGTOKEN" value="${BotToken}" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                        </div>
                        <div>
                            <label>TGID（Telegram Chat ID）</label>
                            <input class="var-input" id="TGID" value="${ChatID}" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                        </div>
                        <div>
                            <label>TOTAL（流量总量 TB）</label>
                            <input class="var-input" id="TOTAL" value="${total}" type="number" step="0.01" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                        </div>
                    </div>
                    <div style="margin-top:25px;">
                        <button class="save-btn" onclick="updateVars(this)">更新变量</button>
                        <span id="varStatus" style="margin-left:15px;"></span>
                    </div>
                </div>
            </div>
        </div>

        ${hasKV ? `
        <div class="section">
            <h2>节点链接编辑</h2>
            <textarea class="editor" id="content" placeholder="在此粘贴你的节点或订阅链接，每行一个">${content}</textarea>
            <div style="display:flex;align-items:center;gap:15px;">
                <button class="save-btn" onclick="saveContent(this)">保存配置</button>
                <span id="saveStatus"></span>
            </div>
        </div>
        ` : `
        <div class="section">
            <h2>节点链接编辑</h2>
            <p style="color:#e74c3c;">请绑定 KV 命名空间以启用编辑功能</p>
        </div>
        `}

        <footer>
            <p>Telegram 频道: <a href="https://t.me/CMLiussss" style="color:#667eea;">@CMLiussss</a> | GitHub: <a href="https://github.com/cmliu/CF-Workers-SUB" style="color:#667eea;">cmliu/CF-Workers-SUB</a></p>
        </footer>
    </div>

    <script>
        const subs = ${JSON.stringify(subs)};

        function updateSub(index) {
            const link = subs[index].link;
            document.getElementById('sub-link').textContent = link;
            document.getElementById('qrcode').innerHTML = '';
            new QRCode(document.getElementById('qrcode'), {
                text: link, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.H
            });

            // 仅在点击按钮时复制
            navigator.clipboard.writeText(link).then(() => {
                alert('已复制订阅链接！\\n' + link);
            }).catch(() => {
                prompt('复制失败，请手动复制：', link);
            });
        }

        // 默认显示自适应
        updateSub(0);

        document.querySelectorAll('.sub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSub(parseInt(btn.dataset.index));
            });
        });

        function toggleConfig() {
            const sec = document.getElementById('configSection');
            const btn = document.getElementById('configToggle');
            sec.classList.toggle('hidden');
            btn.innerHTML = sec.classList.contains('hidden') ? '展开配置 ↓' : '收起配置 ↑';
        }

        function updateSubConfig(btn) {
            btn.disabled = true; btn.textContent = '更新中...';
            const vals = { SUBAPI: document.getElementById('SUBAPI').value, SUBCONFIG: document.getElementById('SUBCONFIG').value };
            fetch(location.href, { method: 'POST', body: JSON.stringify(vals), headers: {'Content-Type':'application/json'} })
                .then(() => document.getElementById('subConfigStatus').textContent = '更新成功 ' + new Date().toLocaleString())
                .catch(() => document.getElementById('subConfigStatus').textContent = '更新失败')
                .finally(() => { btn.disabled = false; btn.textContent = '更新订阅转换配置'; });
        }

        function updateVars(btn) {
            btn.disabled = true; btn.textContent = '更新中...';
            const vals = {};
            document.querySelectorAll('.var-input').forEach(i => vals[i.id] = i.value);
            fetch(location.href, { method: 'POST', body: JSON.stringify(vals), headers: {'Content-Type':'application/json'} })
                .then(() => document.getElementById('varStatus').textContent = '更新成功 ' + new Date().toLocaleString())
                .catch(() => document.getElementById('varStatus').textContent = '更新失败')
                .finally(() => { btn.disabled = false; btn.textContent = '更新变量'; });
        }

        ${hasKV ? `
        let saveTimer;
        const textarea = document.getElementById('content');
        let original = textarea.value;
        function saveContent(btn) {
            btn.disabled = true; btn.textContent = '保存中...';
            const now = textarea.value;
            if (now === original) {
                document.getElementById('saveStatus').textContent = '无变化';
                btn.disabled = false; btn.textContent = '保存配置';
                return;
            }
            fetch(location.href, { method: 'POST', body: now, headers: {'Content-Type':'text/plain;charset=UTF-8'} })
                .then(() => {
                    document.getElementById('saveStatus').textContent = '保存成功 ' + new Date().toLocaleString();
                    original = now;
                })
                .catch(() => document.getElementById('saveStatus').textContent = '保存失败')
                .finally(() => { btn.disabled = false; btn.textContent = '保存配置'; });
        }
        textarea.addEventListener('input', () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => saveContent(document.querySelector('.save-btn')), 3000);
        });
        ` : ''}
    </script>
</body>
</html>
`;

		return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
	} catch (error) {
		return new Response("服务器错误: " + error.message, { status: 500 });
	}
}
