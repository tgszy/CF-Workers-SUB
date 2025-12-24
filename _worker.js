// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
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

		// 从 KV 加载变量，优先 KV > env > 默认
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

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
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
				if (x.toLowerCase().startsWith('http')) {
					订阅链接 += x + '\n';
				} else {
					自建节点 += x + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
					订阅格式 = 'singbox';
				} else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
					订阅格式 = 'surge';
				} else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
					订阅格式 = 'quanx';
				} else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
					订阅格式 = 'loon';
				} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
					订阅格式 = 'clash';
				}
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
					} catch (error) {
						console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
					}
				}
			}

			if (warp) 订阅转换URL += "|" + (await ADD(warp)).join("|");
			//修复中文错误
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			//去重
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

				base64Data = encodeBase64(result)
			}

			// 构建响应头对象
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

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n');
	return add;
}

async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
	return text;
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
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	let parsedURL = new URL(fullURL);
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	let response = await fetch(newURL);

	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)];
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 2000);

	try {
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

		const modifiedResponses = responses.map((response, index) => {
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index]
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index]
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index]
			};
		});

		for (const response of modifiedResponses) {
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null';
				if (content.includes('proxies:')) {
					订阅转换URLs += "|" + response.apiUrl;
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					订阅转换URLs += "|" + response.apiUrl;
				} else if (content.includes('://')) {
					newapi += content + '\n';
				} else if (isValidBase64(content)) {
					newapi += base64Decode(content) + '\n';
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error);
	} finally {
		clearTimeout(timeout);
	}

	const 订阅内容 = await ADD(newapi + 异常订阅);
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		cf: {
			insecureSkipVerify: true,
			allowUntrusted: true,
			validateCertificate: false
		}
	});

	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		await env.KV.put(txt, 旧数据);
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'LINK.txt', guest) {
	const url = new URL(request.url);
	try {
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const body = await request.text();
				let data;
				try {
					data = JSON.parse(body);
					for (let [key, val] of Object.entries(data)) {
						await env.KV.put(key, val);
					}
					return new Response("更新成功");
				} catch (e) {
					await env.KV.put(txt, body);
					return new Response("保存成功");
				}
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				content = '读取数据时发生错误: ' + error.message;
			}
		}

		const baseUrl = `https://${url.hostname}`;
		const ownerBase = `${baseUrl}/${mytoken}`;
		const guestBase = `${baseUrl}/sub?token=${guest}`;

		const subs = [
			{ name: "自适应订阅", owner: ownerBase, guest: `${guestBase}` },
			{ name: "Base64订阅",   owner: `${ownerBase}?b64`, guest: `${guestBase}&b64` },
			{ name: "Clash订阅",    owner: `${ownerBase}?clash`, guest: `${guestBase}&clash` },
			{ name: "Sing-Box订阅", owner: `${ownerBase}?sb`, guest: `${guestBase}&sb` },
			{ name: "Surge订阅",    owner: `${ownerBase}?surge`, guest: `${guestBase}&surge` },
			{ name: "Loon订阅",     owner: `${ownerBase}?loon`, guest: `${guestBase}&loon` }
		];

		const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${FileName} 订阅管理</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: #f6f8fa;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        header h1 { margin: 0; font-size: 28px; }
        header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .section {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child { border-bottom: none; }
        h2 {
            font-size: 20px;
            margin: 0 0 20px;
            color: #444;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
        }

        /* 订阅连接区域 */
        .sub-links {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .sub-card {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            text-align: center;
        }
        .sub-card h3 {
            margin: 0 0 15px;
            font-size: 16px;
            color: #555;
        }
        .sub-label {
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
        }
        .sub-link {
            word-break: break-all;
            color: #667eea;
            font-size: 14px;
            margin-bottom: 15px;
            display: block;
        }
        .qrcode {
            margin: 0 auto;
            width: 200px;
            height: 200px;
        }

        /* 右侧按钮区 */
        .sub-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .sub-btn {
            padding: 12px;
            background: #eef2ff;
            border: 1px solid #667eea;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        .sub-btn:hover, .sub-btn.active {
            background: #667eea;
            color: white;
        }

        .toggle-btn {
            background: none;
            border: none;
            color: #667eea;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 15px;
        }
        .toggle-btn:hover { text-decoration: underline; }
        .hidden { display: none; }

        textarea.editor {
            width: 100%;
            height: 400px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            box-sizing: border-box;
            margin-bottom: 15px;
        }
        .save-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .save-btn:hover { background: #5a6fd8; }
        .save-btn:disabled { background: #aaa; cursor: not-allowed; }

        footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #888;
            background: #f9f9f9;
        }
        @media (max-width: 768px) {
            .sub-links { grid-template-columns: 1fr; }
            .sub-buttons { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>${FileName} 订阅管理</h1>
            <p>一键复制订阅链接并生成二维码</p>
        </header>

        <div class="section">
            <h2>订阅连接</h2>
            <div class="sub-links">
                <div class="sub-card">
                    <span class="sub-label">主人订阅</span>
                    <a class="sub-link" id="owner-link">${subs[0].owner}</a>
                    <div id="owner-qrcode" class="qrcode"></div>
                </div>
                <div class="sub-card">
                    <span class="sub-label">访客订阅</span>
                    <a class="sub-link" id="guest-link">${subs[0].guest}</a>
                    <div id="guest-qrcode" class="qrcode"></div>
                </div>
                <div class="sub-card">
                    <h3>订阅格式切换</h3>
                    <div class="sub-buttons">
                        ${subs.map((sub, i) => `
                        <button class="sub-btn ${i===0 ? 'active' : ''}" data-index="${i}">${sub.name}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>配置订阅转换及变量</h2>
            <button class="toggle-btn" id="configToggle" onclick="toggleConfig()">展开配置 ↓</button>
            <div id="configSection" class="hidden">
                <div style="margin-bottom: 30px;">
                    <label for="SUBAPI">SUBAPI（订阅转换后端）：</label>
                    <input id="SUBAPI" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" value="${subConverter}" />
                    <label for="SUBCONFIG" style="display:block;margin:15px 0 5px;">SUBCONFIG（配置文件）：</label>
                    <input id="SUBCONFIG" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;" value="${subConfig}" />
                    <div style="margin-top:15px;">
                        <button class="save-btn" onclick="updateSubConfig(this)">更新订阅转换配置</button>
                        <span id="subConfigStatus" style="margin-left:15px;"></span>
                    </div>
                </div>

                <div>
                    <div style="margin-bottom:15px;"><strong>变量配置</strong></div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:15px;">
                        <div>
                            <label>TOKEN（主人访问令牌）</label><small style="display:block;color:#888;">例如 abc → https://domain/abc</small>
                            <input class="var-input" id="TOKEN" value="${mytoken}" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
                        </div>
                        <div>
                            <label>GUESTTOKEN（访客订阅令牌）</label><small style="display:block;color:#888;">留空自动生成</small>
                            <input class="var-input" id="GUESTTOKEN" value="${guestToken}" style="width:100%;padding:10px;margin-top:5px;border:1px solid #ddd;border-radius:6px;" />
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
                    <div style="margin-top:20px;">
                        <button class="save-btn" onclick="updateVars(this)">更新变量</button>
                        <span id="varStatus" style="margin-left:15px;"></span>
                    </div>
                </div>
            </div>
        </div>

        ${hasKV ? `
        <div class="section">
            <h2>节点链接编辑</h2>
            <textarea class="editor" id="content" placeholder="${decodeURIComponent(atob('TElOSyVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNCVCOCVBQSVFOCU4QSU4MiVFNyU4MiVCOSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQp2bGVzcyUzQSUyRiUyRjI0NmFhNzk1LTA2MzctNGY0Yy04ZjY0LTJjOGZiMjRjMWJhZCU0MDEyNy4wLjAuMSUzQTEyMzQlM0ZlbmNyeXB0aW9uJTNEbm9uZSUyNnNlY3VyaXR5JTNEdGxzJTI2c25pJTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2YWxsb3dJbnNlY3VyZSUzRDElMjZ0eXBlJTNEd3MlMjZob3N0JTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2cGF0aCUzRCUyNTJGJTI1M0ZlZCUyNTNEMjU2MCUyM0NGbmF0CnRyb2phbiUzQSUyRiUyRmFhNmRkZDJmLWQxY2YtNGE1Mi1iYTFiLTI2NDBjNDFhNzg1NiU0MDIxOC4xOTAuMjMwLjIwNyUzQTQxMjg4JTNGc2VjdXJpdHklM0R0bHMlMjZzbmklM0RoazEyLmJpbGliaWxpLmNvbSUyNmFsbG93SW5zZWN1cmUlM0QxJTI2dHlwZSUzRHRjcCUyNmhlYWRlclR5cGUlM0Rub25lJTIzSEsKc3MlM0ElMkYlMkZZMmhoWTJoaE1qQXRhV1YwWmkxd2IyeDVNVE13TlRveVJYUlFjVzQyU0ZscVZVNWpTRzlvVEdaVmNFWlJkMjVtYWtORFVUVnRhREZ0U21SRlRVTkNkV04xVjFvNVVERjFaR3RTUzBodVZuaDFielUxYXpGTFdIb3lSbTgyYW5KbmRERTRWelkyYjNCMGVURmxOR0p0TVdwNlprTm1RbUklMjUzRCU0MDg0LjE5LjMxLjYzJTNBNTA4NDElMjNERQoKCiVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNiU5RCVBMSVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQpodHRwcyUzQSUyRiUyRnN1Yi54Zi5mcmVlLmhyJTJGYXV0bw=='))}">${content}</textarea>
            <div style="display:flex;align-items:center;gap:15px;">
                <button class="save-btn" onclick="saveContent(this)">保存配置</button>
                <span id="saveStatus"></span>
            </div>
        </div>
        ` : `
        <div class="section">
            <h2>节点链接编辑</h2>
            <p style="color: #e74c3c;">请在 Worker 环境变量中绑定名为 <strong>KV</strong> 的 KV 命名空间以启用编辑功能</p>
        </div>
        `}

        <footer>
            <p>Telegram 频道: <a href="https://t.me/CMLiussss" style="color: #667eea;">@CMLiussss</a> | GitHub: <a href="https://github.com/cmliu/CF-Workers-SUB" style="color: #667eea;">cmliu/CF-Workers-SUB</a></p>
            <p>UA: <strong>${request.headers.get('User-Agent')}</strong></p>
        </footer>
    </div>

    <script>
        const subs = ${JSON.stringify(subs)};

        function renderQR(ownerUrl, guestUrl, index) {
            document.getElementById('owner-link').textContent = subs[index].owner;
            document.getElementById('owner-link').href = "javascript:void(0)";
            document.getElementById('guest-link').textContent = subs[index].guest;

            document.getElementById('owner-qrcode').innerHTML = '';
            document.getElementById('guest-qrcode').innerHTML = '';

            new QRCode(document.getElementById('owner-qrcode'), {
                text: subs[index].owner,
                width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H
            });
            new QRCode(document.getElementById('guest-qrcode'), {
                text: subs[index].guest,
                width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H
            });

            // 复制主人链接
            navigator.clipboard.writeText(subs[index].owner).then(() => {
                alert('已复制主人订阅链接！\\n' + subs[index].owner);
            }).catch(() => {
                prompt('复制失败，请手动复制主人链接：', subs[index].owner);
            });
        }

        // 初始化默认显示自适应
        renderQR(subs[0].owner, subs[0].guest, 0);

        // 按钮点击事件
        document.querySelectorAll('.sub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const idx = parseInt(btn.dataset.index);
                renderQR(subs[idx].owner, subs[idx].guest, idx);
            });
        });

        function toggleConfig() {
            const sec = document.getElementById('configSection');
            const btn = document.getElementById('configToggle');
            if (sec.classList.contains('hidden')) {
                sec.classList.remove('hidden');
                btn.innerHTML = '收起配置 ↑';
            } else {
                sec.classList.add('hidden');
                btn.innerHTML = '展开配置 ↓';
            }
        }

        function updateSubConfig(btn) {
            btn.disabled = true; btn.textContent = '更新中...';
            const vals = { SUBAPI: document.getElementById('SUBAPI').value, SUBCONFIG: document.getElementById('SUBCONFIG').value };
            fetch(location.href, { method: 'POST', body: JSON.stringify(vals), headers: {'Content-Type':'application/json'} })
                .then(r => { if(!r.ok) throw ''; return r.text(); })
                .then(() => { document.getElementById('subConfigStatus').textContent = '更新成功 ' + new Date().toLocaleString(); })
                .catch(() => { document.getElementById('subConfigStatus').textContent = '更新失败'; document.getElementById('subConfigStatus').style.color='red'; })
                .finally(() => { btn.disabled=false; btn.textContent='更新订阅转换配置'; });
        }

        function updateVars(btn) {
            btn.disabled = true; btn.textContent = '更新中...';
            const vals = {};
            document.querySelectorAll('.var-input').forEach(i => vals[i.id] = i.value);
            fetch(location.href, { method: 'POST', body: JSON.stringify(vals), headers: {'Content-Type':'application/json'} })
                .then(r => { if(!r.ok) throw ''; return r.text(); })
                .then(() => { document.getElementById('varStatus').textContent = '更新成功 ' + new Date().toLocaleString(); })
                .catch(() => { document.getElementById('varStatus').textContent = '更新失败'; document.getElementById('varStatus').style.color='red'; })
                .finally(() => { btn.disabled=false; btn.textContent='更新变量'; });
        }

        ${hasKV ? `
        let saveTimer;
        const textarea = document.getElementById('content');
        let originalContent = textarea.value;

        function saveContent(btn) {
            btn.disabled = true; btn.textContent = '保存中...';
            const newContent = textarea.value;
            if (newContent === originalContent) {
                document.getElementById('saveStatus').textContent = '内容无变化';
                btn.disabled = false; btn.textContent = '保存配置';
                return;
            }
            fetch(location.href, { method: 'POST', body: newContent, headers: {'Content-Type':'text/plain;charset=UTF-8'} })
                .then(r => { if(!r.ok) throw ''; return r.text(); })
                .then(() => {
                    document.getElementById('saveStatus').textContent = '保存成功 ' + new Date().toLocaleString();
                    originalContent = newContent;
                })
                .catch(() => { document.getElementById('saveStatus').textContent = '保存失败'; document.getElementById('saveStatus').style.color='red'; })
                .finally(() => { btn.disabled=false; btn.textContent='保存配置'; });
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

		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		console.error('处理请求时发生错误:', error);
		return new Response("服务器错误: " + error.message, {
			status: 500,
			headers: { "Content-Type": "text/plain;charset=utf-8" }
		});
	}
}
