/* global chrome */
const FALLBACK_LANG = 'english.json';
const LANG_KEY      = 'lang';
const MENU_ID       = 'ihf-view';

/* ------------------------------------------------------------------ */
/* i18n helper – keeps meta from target file, inherits missing phrases */
/* ------------------------------------------------------------------ */
async function loadLang(fileName) {
    const fallbackUrl = chrome.runtime.getURL(`i18n/${FALLBACK_LANG}`);
    const fallback    = await (await fetch(fallbackUrl)).json();

    if (fileName === FALLBACK_LANG) return fallback;

    try {
        const targetUrl = chrome.runtime.getURL(`i18n/${fileName}`);
        const obj       = await (await fetch(targetUrl)).json();
        return { ...obj, phrases: { ...fallback.phrases, ...obj.phrases } };
    } catch {
        return fallback;
    }
}

/* ------------------------------------------------------------------ */
/* PNG parser (runs here, never in the content-script)                 */
/* ------------------------------------------------------------------ */
function extractTextChunks(buf, phrases) {
    const view = new DataView(buf);
    const sig  = '\x89PNG\r\n\x1a\n';
    for (let i = 0; i < 8; i++) {
        if (String.fromCharCode(view.getUint8(i)) !== sig[i]) {
            return [phrases.lensNoData];
        }
    }

    let offset = 8, sawIHDR = false;
    const pages = [], raw = [];
    const td = new TextDecoder();

    while (offset + 8 <= view.byteLength) {
        const length = view.getUint32(offset); offset += 4;
        const type   = String.fromCharCode(
            view.getUint8(offset),     view.getUint8(offset + 1),
            view.getUint8(offset + 2), view.getUint8(offset + 3)
        ); offset += 4;

        if (type === 'IHDR') sawIHDR = true;
        if (type === 'IDAT') break;

        const dataStart = offset;
        const dataEnd   = offset + length;
        if (dataEnd > view.byteLength) break;

        if (type === 'tEXt') {
            const bytes = new Uint8Array(buf.slice(dataStart, dataEnd));
            const text  = td.decode(bytes);
            const nul   = text.indexOf('\0');
            const val   = nul === -1 ? text : text.slice(nul + 1);
            try { pages.push(JSON.stringify(JSON.parse(val), null, 2)); }
            catch { pages.push(val); }
        } else if (sawIHDR) {
            raw.push(td.decode(new Uint8Array(buf.slice(dataStart, dataEnd))));
        }
        offset = dataEnd + 4;             // skip CRC
    }

    if (pages.length) return pages;
    if (raw.length)   return [`${phrases.lensRawWarn}\n\n${raw.join('')}`];
    return [phrases.lensNoData];
}

/* ------------------------------------------------------------------ */
/* Build (or update) the context-menu entry                            */
/* ------------------------------------------------------------------ */
async function buildContextMenu() {
    const { [LANG_KEY]: langFile = FALLBACK_LANG } = await chrome.storage.local.get(LANG_KEY);
    const t = await loadLang(langFile);

    chrome.contextMenus.update(
        MENU_ID,
        { title: t.phrases.contextMenu },
        () => {
            if (chrome.runtime.lastError) {
                chrome.contextMenus.create({
                    id: MENU_ID,
                    title: t.phrases.contextMenu,
                    contexts: ['image']
                });
            }
        }
    );
}

/* ------------------------------------------------------------------ */
/* Install / update                                                   */
/* ------------------------------------------------------------------ */
chrome.runtime.onInstalled.addListener(async () => {
    const stored = await chrome.storage.local.get(LANG_KEY);
    if (!stored[LANG_KEY]) {
        await chrome.storage.local.set({ [LANG_KEY]: FALLBACK_LANG });
    }
    buildContextMenu();
});

/* rebuild menu on language change */
chrome.storage.onChanged.addListener((chg, area) => {
    if (area === 'local' && chg[LANG_KEY]) buildContextMenu();
});

/* ------------------------------------------------------------------ */
/* Content-script → background request: “give me pages[]”             */
/* ------------------------------------------------------------------ */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.action !== 'ihf-get-pages') return;

    (async () => {
        try {
            const t   = await loadLang(msg.langFile || FALLBACK_LANG);
            let target = msg.url;
            if (msg.cacheBust) {
                try {
                    const u = new URL(msg.url);
                    u.searchParams.append('ihf_nopolish', Date.now().toString(36));
                    target = u.toString();
                } catch {}
            }
            const buf = await (await fetch(target, { cache: 'no-store' })).arrayBuffer();
            const pages = extractTextChunks(buf, t.phrases);
            sendResponse({ ok: true, pages });
        } catch (e) {
            console.error('iHeaderFox fetch/parse failed:', e);
            sendResponse({ ok: false, error: e.message });
        }
    })();

    return true; // asynchronous
});

/* ------------------------------------------------------------------ */
/* Context-menu click handler                                         */
/* ------------------------------------------------------------------ */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID) return;

    /* 1. inject lens stylesheet */
    await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles/lens.css']
    });

    /* 2. stash URL on the page (simplest bridge) */
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: url => { window.__iHeaderFoxURL = url; },
        args: [info.srcUrl]
    });

    /* 3. inject / re-inject lens script */
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lens.js']
    });
});
