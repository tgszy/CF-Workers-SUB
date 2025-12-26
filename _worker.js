// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = '6ac0974f22bda6966c4538638523ebd5'; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; //订阅配置文件
let subProtocol = 'https';
let linkSub = '';
let warp = '';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');

		if (env.KV) {
			mytoken = await env.KV.get('TOKEN') || env.TOKEN || mytoken;
			guestToken = await env.KV.get('GUESTTOKEN') || env.GUESTTOKEN || env.GUEST || guestToken;
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
			guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
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
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname === "/" + mytoken || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					return await KV(request, env, 'LINK.txt', 访客订阅);
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
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

			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);

			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) 订阅格式 = 'singbox';
				else if (userAgent.includes('surge') || url.searchParams.has('surge')) 订阅格式 = 'surge';
				else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) 订阅格式 = 'quanx';
				else if (userAgent.includes('loon') || url.searchParams.has('loon')) 订阅格式 = 'loon';
				else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) 订阅格式 = 'clash';
			}

			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			let req_data = MainData;
			let 追加UA = 'v2rayn';

			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim());
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
					let subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const resp = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB' } });
						if (resp.ok) req_data += '\n' + atob(await resp.text());
					} catch {}
				}
			}

			if (warp) 订阅转换URL += "|" + (await ADD(warp)).join("|");

			const utf8Encoder = new TextEncoder();
			const text = new TextDecoder().decode(utf8Encoder.encode(req_data));
			const result = [...new Set(text.split('\n'))].join('\n');

			let base64Data;
			try { base64Data = btoa(result); } catch {
				const binary = new TextEncoder().encode(result);
				let str = '';
				const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
				for (let i = 0; i < binary.length; i += 3) {
					str += chars[binary[i] >> 2];
					str += chars[((binary[i] & 3) << 4) | (binary[i + 1] >> 4)];
					str += chars[((binary[i + 1] & 15) << 2) | (binary[i + 2] >> 6)];
					str += chars[binary[i + 2] & 63];
				}
				const pad = 3 - (binary.length % 3 || 3);
				base64Data = str.slice(0, str.length - pad) + '=='.slice(0, pad);
			}

			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
			};

			if (订阅格式 === 'base64' || token === fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			}

			let subConverterUrl;
			if (订阅格式 === 'clash') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			else if (订阅格式 === 'singbox') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			else if (订阅格式 === 'surge') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			else if (订阅格式 === 'quanx') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			else if (订阅格式 === 'loon') subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;

			try {
				const resp = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
				if (!resp.ok) return new Response(base64Data, { headers: responseHeaders });
				let content = await resp.text();
				if (订阅格式 === 'clash') content = await clashFix(content);
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(content, { headers: responseHeaders });
			} catch {
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

async function ADD(envadd) {
	let addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	if (addtext[0] === '\n') addtext = addtext.slice(1);
	if (addtext[addtext.length - 1] === '\n') addtext = addtext.slice(0, -1);
	return addtext.split('\n');
}

async function nginx() {
	return `<!DOCTYPE html><html><head><title>Welcome to nginx!</title><style>body{width:35em;margin:0 auto;font-family:Tahoma,Verdana,Arial,sans-serif;}</style></head><body><h1>Welcome to nginx!</h1><p>If you see this page, the nginx web server is successfully installed and working.</p></body></html>`;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken && ChatID) {
		let msg = type + "\nIP: " + ip + "\n<tg-spoiler>" + add_data;
		const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (res.ok) {
			const info = await res.json();
			msg = type + `\nIP: ${ip}\n国家: ${info.country}\n城市: ${info.city}\n组织: ${info.org}\n${add_data}`;
		}
		await fetch(`https://api.telegram.org/bot${BotToken}/sendMessage?chat_id=${ChatID}&parse_mode=HTML&text=${encodeURIComponent(msg)}`);
	}
}

async function MD5MD5(text) {
	const enc = new TextEncoder();
	const hash1 = await crypto.subtle.digest('MD5', enc.encode(text));
	const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, '0')).join('');
	const hash2 = await crypto.subtle.digest('MD5', enc.encode(hex1.slice(7, 27)));
	return Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		return content.replace(/, mtu: 1280, udp: true/g, ', mtu: 1280, remote-dns-resolve: true, udp: true');
	}
	return content;
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const old = await env.KV.get(`/${txt}`);
	if (old && !await env.KV.get(txt)) {
		await env.KV.put(txt, old);
		await env.KV.delete(`/${txt}`);
	}
}

async function KV(request, env, txt = 'LINK.txt', guest) {
	const url = new URL(request.url);
	try {
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			const body = await request.text();
			
			// 处理变量更新请求
			if (url.pathname === '/update') {
				try {
					const data = JSON.parse(body);
					// 只保存我们需要的四个变量（TOTAL 已移除）
					if (data.TOKEN !== undefined) await env.KV.put('TOKEN', data.TOKEN);
					if (data.GUESTTOKEN !== undefined) {
						await env.KV.put('GUESTTOKEN', data.GUESTTOKEN);
					}
					if (data.TGTOKEN !== undefined) await env.KV.put('TGTOKEN', data.TGTOKEN);
					if (data.TGID !== undefined) await env.KV.put('TGID', data.TGID);
					
					// 如果GUESTTOKEN为空字符串，强制清除KV中的旧值并使用默认值
					if (data.GUESTTOKEN === '') {
						await env.KV.delete('GUESTTOKEN');
						await env.KV.put('GUESTTOKEN', '6ac0974f22bda6966c4538638523ebd5');
					}
					
					return new Response("更新成功");
				} catch {
					return new Response("数据格式错误", { status: 400 });
				}
			}
			
			// 处理内容保存请求
			try {
				const data = JSON.parse(body);
				// 只保存我们需要的四个变量（TOTAL 已移除）
				if (data.TOKEN !== undefined) await env.KV.put('TOKEN', data.TOKEN);
				if (data.GUESTTOKEN !== undefined) await env.KV.put('GUESTTOKEN', data.GUESTTOKEN || ''); // 支持空值
				if (data.TGTOKEN !== undefined) await env.KV.put('TGTOKEN', data.TGTOKEN);
				if (data.TGID !== undefined) await env.KV.put('TGID', data.TGID);
				
				// 如果GUESTTOKEN为空，强制清除KV中的旧值并使用默认值
				if (!data.GUESTTOKEN || data.GUESTTOKEN.trim() === '') {
					await env.KV.delete('GUESTTOKEN');
					await env.KV.put('GUESTTOKEN', '6ac0974f22bda6966c4538638523ebd5');
				}
				
				return new Response("更新成功");
			} catch {
				await env.KV.put(txt, body);
				return new Response("保存成功");
			}
		}

		// 获取变量的接口
		if (url.pathname === '/getVars') {
			if (!env.KV) return new Response(JSON.stringify({}), { 
				status: 200, 
				headers: { 'Content-Type': 'application/json' } 
			});
			
			const vars = {
				'subConverter': await env.KV.get('SUBAPI') || subConverter,
				'subConfig': await env.KV.get('SUBCONFIG') || subConfig,
				'TOKEN': await env.KV.get('TOKEN') || mytoken,
				'GUESTTOKEN': await env.KV.get('GUESTTOKEN') || guestToken,
				'TGTOKEN': await env.KV.get('TGTOKEN') || BotToken,
				'TGID': await env.KV.get('TGID') || ChatID
			};
			
			return new Response(JSON.stringify(vars), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		let content = '';
		const hasKV = !!env.KV;
		if (hasKV) content = await env.KV.get(txt) || '';

		const hostname = url.hostname;
		const ownerBase = `https://${hostname}/${mytoken}`;
		const guestBase = `https://${hostname}/sub?token=${guest}`;

		const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${FileName} 订阅管理</title>
<style>
:root{--primary:#6366f1;--primary-dark:#4f46e5;--text:#1f2937;--text-light:#6b7280;--bg:#f9fafb;--card:#ffffff;--border:#e5e7eb}
[data-theme="dark"]{--text:#f3f4f6;--text-light:#9ca3af;--bg:#111827;--card:#1f2937;--border:#374151}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);margin:0;padding:20px;line-height:1.6}
.container{max-width:1100px;margin:0 auto;background:var(--card);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.1);overflow:hidden}
header{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;padding:2rem;text-align:center;position:relative}
header h1{margin:0;font-size:1.8rem}header p{margin:.5rem 0 0;opacity:.9}
.theme-toggle{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.2);border:none;color:white;padding:.5rem;border-radius:8px;cursor:pointer;font-size:1.2rem;transition:.2s}
.theme-toggle:hover{background:rgba(255,255,255,.3)}
.section{padding:1.8rem;border-bottom:1px solid var(--border)}
.section:last-child{border-bottom:none}
h2{font-size:1.4rem;margin:0 0 1rem;color:var(--text);display:flex;align-items:center;gap:.5rem}
h2::before{content:"";width:6px;height:1.6em;background:var(--primary);border-radius:3px}
.sub-container{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:.8rem;align-items:center}
.sub-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;max-height:280px}
.sub-buttons .section-title{grid-column:1/-1;text-align:center;font-weight:600;color:var(--primary);margin:.3rem 0;font-size:.9rem}
.sub-buttons.compact .sub-btn{padding:.4rem .3rem;font-size:.8rem;line-height:1.1}
.sub-btn{padding:.5rem .4rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;text-align:center;cursor:pointer;font-size:.85rem;transition:.2s;line-height:1.2}
.sub-btn:hover{background:var(--primary);color:white;border-color:var(--primary)}
.qrcode-display{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:1rem;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;width:240px;height:240px;box-sizing:border-box;overflow:hidden;margin:0 auto}
.qrcode-display .placeholder{color:var(--text-light);font-size:1.1rem}
#qr-temp{margin:1rem 0}
.link-info{word-break:break-all;margin:.8rem 0;color:var(--text-light);font-size:.9rem;max-width:90%}
.copy-btn{background:var(--primary);color:white;border:none;padding:.6rem 1.2rem;border-radius:8px;cursor:pointer;margin-top:.5rem}
.save-container{margin-top:1rem;display:flex;align-items:center;gap:1rem}
.save-btn{background:var(--primary);color:white;border:none;padding:.7rem 1.5rem;border-radius:8px;cursor:pointer}
.toggle-btn{background:none;border:none;color:var(--primary);font-size:1rem;cursor:pointer;margin-top:.5rem}
.toggle-btn:hover{text-decoration:underline}
.hidden{display:none}
.var-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
.var-item label{display:block;margin-bottom:.4rem;font-weight:600}
.var-item small{display:block;color:var(--text-light);font-size:.85rem;margin-top:.3rem}
.var-item input{width:100%;padding:.7rem;border:1px solid var(--border);border-radius:8px;box-sizing:border-box}
#content{width:100%;height:300px;padding:1rem;border:1px solid var(--border);border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:14.5px;background:var(--bg);color:var(--text);resize:vertical;box-sizing:border-box}
#content:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(99,102,241,.2)}
footer{text-align:center;padding:1.5rem;font-size:.9rem;color:var(--text-light);background:var(--bg)}
@media (max-width:768px){
.sub-container{grid-template-columns:1fr;gap:1.5rem;align-items:center;margin-top:1rem}
.sub-buttons{grid-template-columns:1fr;gap:1rem;max-height:none}
.sub-btn{font-size:1.1rem;padding:1.2rem 1rem;line-height:1.3;border-radius:10px;min-height:56px}
.sub-buttons .section-title{font-size:1rem;margin:.5rem 0}
.qrcode-display{width:280px;height:280px;margin:1.5rem auto;padding:1.2rem}
.qrcode-display .placeholder{font-size:1.2rem}
.var-grid{grid-template-columns:1fr;gap:1.2rem}
.var-item label{font-size:1rem;margin-bottom:.6rem}
.var-item input{padding:.8rem;border-radius:10px;font-size:1rem}
#content{height:250px;padding:1rem;border-radius:10px;font-size:16px}
.toggle-btn{font-size:1.1rem;padding:.8rem 0}
.save-btn{font-size:1rem;padding:1rem 1.5rem;border-radius:10px}
.save-container{gap:.8rem;flex-wrap:wrap}
.theme-toggle{font-size:1.2rem;padding:.6rem;border-radius:8px}
h1{font-size:1.6rem;line-height:1.3}
h2{font-size:1.3rem;margin:0 0 1.2rem}
.section{padding:1.5rem}
.container{padding:0 1rem}
.link-info{font-size:.8rem}
.copy-btn{font-size:.8rem;padding:.4rem .8rem}
footer{font-size:.85rem;padding:1.2rem}
footer p{margin:.5rem 0}
}
</style>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@4.5.12/index.min.css">
</head>
<body>
<div class="container">
<header>
  <button class="theme-toggle" id="themeToggle" title="切换主题">🌙</button>
  <h1>${FileName} 订阅管理</h1><p>自建节点 + 机场聚合订阅转换</p>
</header>

<div class="section">
<h2>订阅连接</h2>
<div class="sub-container">
<div class="sub-buttons" id="subscription-buttons"></div>
<div class="qrcode-display" id="qrcode-display"><p class="placeholder">点击左侧按钮生成二维码</p></div>
</div>
</div>

<div class="section">
<h2>变量配置</h2>
<button class="toggle-btn" id="varToggle">展开配置 ↓</button>
<div id="varSection" class="hidden">
<div class="var-grid">
<div class="var-item" style="grid-column:1/-1">
<label for="subConverter">SUB-Converter（订阅转换服务地址）</label>
<input id="subConverter" value="${subConverter}">
<small>订阅转换服务的地址，用于转换订阅格式，可留空使用默认值</small>
</div>
<div class="var-item" style="grid-column:1/-1">
<label for="subConfig">SUB-Config（订阅配置文件）</label>
<input id="subConfig" value="${subConfig}">
<small>订阅配置文件URL，用于Clash等客户端的配置规则</small>
</div>
<div class="var-item">
<label for="TOKEN">TOKEN（主人令牌）</label>
<input id="TOKEN" value="${mytoken}">
<small>用于浏览器访问本配置页的路径令牌，例如设置为 abc 则访问 https://your.domain/abc</small>
</div>
<div class="var-item">
<label for="GUESTTOKEN">GUESTTOKEN（访客令牌）</label>
<input id="GUESTTOKEN" value="${guestToken}">
<small>访客通过 /sub?token=xxx 访问订阅链接的令牌，可随便设置或留空自动生成</small>
<small style="display:block;margin-top:.2rem;color:#ef4444;">访客令牌修改后，更新变量后访客订阅未刷新，实际已生效，需要刷新页面</small>
</div>
<div class="var-item">
<label for="TGTOKEN">TGTOKEN（Telegram Bot Token）</label>
<input id="TGTOKEN" value="${BotToken}">
<small>用于接收访问通知的 Bot Token，可留空不启用通知</small>
</div>
<div class="var-item">
<label for="TGID">TGID（Telegram Chat ID）</label>
<input id="TGID" value="${ChatID}">
<small>接收通知的聊天ID，可通过 @userinfobot 获取</small>
</div>
</div>
<div class="save-container" style="margin-top:1.5rem">
<button class="save-btn" onclick="updateVars(this)">更新变量</button>
<span class="save-status" id="varStatus"></span>
</div>
</div>
</div>

${hasKV ? `
<div class="section">
<h2>节点链接编辑</h2>
<textarea id="content" placeholder="每行一个节点或者机场订阅链接\n节点示例：\nvless://\nvmess://\ntrojan://\ntuic://\n机场订阅链接\n\n#号可作为 节点备注也可修改节点默认名称\nVmess节点 可使用Base64解码后，修改节点名称后再重新编码后导入使用"></textarea>
<div class="save-container">
<button class="save-btn" onclick="saveContent(this)">保存配置</button>
<span class="save-status" id="saveStatus"></span>
</div>
</div>
` : `<div class="section"><h2>节点链接编辑</h2><p style="color:#ef4444">请绑定 KV 以启用编辑</p></div>`}

<footer>
<p>Telegram: <a href="https://t.me/CMLiussss">@CMLiussss</a> | GitHub: <a href="https://github.com/cmliu/CF-Workers-SUB">cmliu/CF-Workers-SUB</a></p>
</footer>
</div>

<script>
// 主题切换功能
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
}

themeToggle.onclick = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
        html.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
};

const ownerLinks = [
["自适应订阅","${ownerBase}"],
["Base64 订阅","${ownerBase}?b64"],
["Clash 订阅","${ownerBase}?clash"],
["Sing-box 订阅","${ownerBase}?sb"],
["Surge 订阅","${ownerBase}?surge"],
["Loon 订阅","${ownerBase}?loon"]
];

const guestLinks = [
["访客自适应","${guestBase}"],
["访客 Base64","${guestBase}&b64"],
["访客 Clash","${guestBase}&clash"],
["访客 Sing-box","${guestBase}&sb"],
["访客 Surge","${guestBase}&surge"],
["访客 Loon","${guestBase}&loon"]
];

function createSubscriptionButtons() {
	const container = document.getElementById('subscription-buttons');
	
	// 添加主人订阅标题
	const ownerTitle = document.createElement('div');
	ownerTitle.className = 'section-title';
	ownerTitle.textContent = '主人订阅';
	container.appendChild(ownerTitle);
	
	// 添加主人订阅按钮（所有按钮）
	ownerLinks.forEach(([name, link]) => {
		const btn = document.createElement('button');
		btn.className = 'sub-btn';
		btn.textContent = name;
		btn.onclick = () => generateQR(link, 'qrcode-display', name);
		container.appendChild(btn);
	});
	
	// 添加访客订阅标题
	const guestTitle = document.createElement('div');
	guestTitle.className = 'section-title';
	guestTitle.textContent = '访客订阅';
	container.appendChild(guestTitle);
	
	// 添加访客订阅按钮（所有按钮）
	guestLinks.forEach(([name, link]) => {
		const btn = document.createElement('button');
		btn.className = 'sub-btn';
		btn.textContent = name;
		btn.onclick = () => generateQR(link, 'qrcode-display', name);
		container.appendChild(btn);
	});
	
	// 添加访客订阅提示文本
	const guestWarning = document.createElement('div');
	guestWarning.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-light);font-size:.8rem;margin-top:.3rem;padding:.3rem .5rem;background:var(--bg);border:1px dashed var(--border);border-radius:6px;';
	guestWarning.textContent = '注意：访客订阅仅提供订阅功能，访问不了面板';
	container.appendChild(guestWarning);
}

function generateQR(link, displayId, name) {
	const display = document.getElementById(displayId);
	display.innerHTML = \`
		<h3 style="margin:0 0 .3rem;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">\${name}</h3>
		<div id="qr-temp" style="display:flex;justify-content:center;align-items:center;"></div>
		<p class="link-info" style="word-break:break-all;margin:.3rem 0;color:var(--text-light);font-size:.7rem;max-width:100%;line-height:1.2">\${link}</p>
		<button class="copy-btn" onclick="navigator.clipboard.writeText('\${link}').then(()=>alert('已复制！')).catch(()=>prompt('复制失败，手动复制：','\${link}'))" style="background:var(--primary);color:white;border:none;padding:.3rem .6rem;border-radius:6px;cursor:pointer;font-size:.7rem;margin-top:.2rem">复制链接</button>
	\`;
	new QRCode(document.getElementById("qr-temp"), {
		text: link,
		width: 120,
		height: 120,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H
	});
}

createSubscriptionButtons();

document.getElementById('varToggle').onclick = () => {
	const sec = document.getElementById('varSection');
	const btn = document.getElementById('varToggle');
	sec.classList.toggle('hidden');
	btn.textContent = sec.classList.contains('hidden') ? '展开配置 ↓' : '收起配置 ↑';
};

${hasKV ? `
let timer;
const ta = document.getElementById('content');
let orig = ta.value;
function saveContent(btn) {
	btn.disabled = true; btn.textContent = '保存中...';
	const newc = ta.value;
	if (newc === orig) { document.getElementById('saveStatus').textContent = '无变化'; btn.disabled = false; btn.textContent = '保存配置'; return; }
	fetch(location.href, {method:'POST', body:newc, headers:{'Content-Type':'text/plain;charset=UTF-8'}})
	.then(r => r.ok ? Promise.resolve() : Promise.reject())
	.then(() => { const t = new Date().toLocaleString(); document.getElementById('saveStatus').textContent = '保存成功 ' + t; orig = newc; })
	.catch(() => { document.getElementById('saveStatus').textContent = '保存失败'; document.getElementById('saveStatus').style.color = '#ef4444'; })
	.finally(() => { btn.disabled = false; btn.textContent = '保存配置'; });
}
ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => saveContent(document.querySelector('.save-btn')), 3000); });
` : ''}

function updateVars(btn) {
	btn.disabled = true; btn.textContent = '更新中...';
	const data = {};
	document.querySelectorAll('#varSection input').forEach(i => data[i.id] = i.value);
	fetch(location.href, {method:'POST', body:JSON.stringify(data), headers:{'Content-Type':'application/json'}})
	.then(r => r.ok ? Promise.resolve() : Promise.reject())
	.then(() => document.getElementById('varStatus').textContent = '更新成功 ' + new Date().toLocaleString())
	.catch(() => { document.getElementById('varStatus').textContent = '更新失败'; document.getElementById('varStatus').style.color = '#ef4444'; })
	.finally(() => { btn.disabled = false; btn.textContent = '更新变量'; });
}
</script>
</body>
</html>`;

		return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
	} catch (e) {
		return new Response("服务器错误: " + e.message, { status: 500 });
	}
}